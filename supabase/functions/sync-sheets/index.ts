
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SheetRow {
  [key: string]: string | number;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { spreadsheetId, range, columnMapping } = await req.json();
    
    if (!spreadsheetId || !range) {
      return new Response(
        JSON.stringify({ error: 'spreadsheetId e range são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Iniciando sincronização com Google Sheets:', { spreadsheetId, range });

    const apiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Chave da API do Google Sheets não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Primeiro, obter informações sobre a planilha para descobrir os nomes das abas
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
    
    let sheetsResponse;
    let effectiveRange = range;
    
    try {
      const metadataResponse = await fetch(metadataUrl);
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json();
        const sheetNames = metadata.sheets?.map((sheet: any) => sheet.properties?.title) || [];
        console.log('Abas disponíveis na planilha:', sheetNames);
        
        // Se o range especificado não existir, usar a primeira aba
        if (sheetNames.length > 0) {
          const originalRange = range;
          
          // Se o range usa "Sheet1" mas não existe, usar a primeira aba
          if (range.startsWith('Sheet1!') && !sheetNames.includes('Sheet1')) {
            effectiveRange = range.replace('Sheet1!', `${sheetNames[0]}!`);
            console.log(`Ajustando range de "${originalRange}" para "${effectiveRange}"`);
          }
        }
      }
    } catch (error) {
      console.log('Aviso: Não foi possível obter metadados da planilha, tentando com range original');
    }

    // Tentar acessar os dados
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(effectiveRange)}?key=${apiKey}`;
    sheetsResponse = await fetch(sheetsUrl);
    
    if (!sheetsResponse.ok) {
      const errorData = await sheetsResponse.text();
      console.error('Erro ao acessar Google Sheets:', errorData);
      
      let errorMessage = 'Erro ao acessar Google Sheets';
      if (errorData.includes('Unable to parse range')) {
        errorMessage = `Erro no formato do intervalo "${effectiveRange}". Verifique se o nome da aba está correto. Exemplo: "NomeDaAba!A:I"`;
      } else if (errorData.includes('Requested entity was not found')) {
        errorMessage = 'Planilha não encontrada. Verifique se o ID está correto e se a planilha está pública ou compartilhada';
      } else if (errorData.includes('The caller does not have permission')) {
        errorMessage = 'Sem permissão para acessar a planilha. Certifique-se de que ela está pública ou compartilhada corretamente';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sheetsData = await sheetsResponse.json();
    const rows = sheetsData.values || [];
    
    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhum dado encontrado na planilha' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Primeira linha são os cabeçalhos
    const headers = rows[0];
    const dataRows = rows.slice(1);

    console.log('Dados encontrados:', { headers, totalRows: dataRows.length });

    // Processar dados
    const processedData = dataRows.map((row: string[]) => {
      const rowData: SheetRow = {};
      headers.forEach((header: string, index: number) => {
        rowData[header] = row[index] || '';
      });
      return rowData;
    });

    // Mapear para formato do banco de dados
    const mapping = columnMapping || {
      cliente_nome: 'Cliente',
      cpf_cnpj: 'CPF/CNPJ',
      valor: 'Valor',
      vencimento: 'Vencimento',
      empreendimento: 'Empreendimento',
      produto: 'Produto',
      status_cliente: 'Status Cliente',
      tipo_cobranca: 'Tipo Cobrança',
      quantidade_parcelas: 'Quantidade de Parcelas'
    };

    const cobrancas = processedData.map((row: SheetRow) => {
      const cobranca: any = {
        cliente_nome: row[mapping.cliente_nome] || 'Cliente não informado',
        cpf_cnpj: String(row[mapping.cpf_cnpj] || ''),
        valor: parseFloat(String(row[mapping.valor] || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
        vencimento: formatDate(String(row[mapping.vencimento] || '')),
        produto: row[mapping.produto] || 'Produto não informado',
        empreendimento: row[mapping.empreendimento] || null,
        status_cliente: row[mapping.status_cliente] || null,
        tipo_cobranca: row[mapping.tipo_cobranca] || null,
        quantidade_parcelas: parseInt(String(row[mapping.quantidade_parcelas] || '1')) || 1,
        status_pagamento: 'em_aberto'
      };

      return cobranca;
    });

    // Filtrar dados válidos
    const validCobrancas = cobrancas.filter(c => 
      c.cliente_nome !== 'Cliente não informado' && 
      c.cpf_cnpj && 
      c.valor > 0
    );

    console.log('Dados processados:', { total: validCobrancas.length });

    if (validCobrancas.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'Nenhum dado válido encontrado para importar',
          details: 'Verifique se os dados possuem Cliente, CPF/CNPJ e Valor preenchidos corretamente'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já existem registros similares para evitar duplicatas
    let insertedCount = 0;
    let skippedCount = 0;

    for (const cobranca of validCobrancas) {
      try {
        // Verificar se já existe um registro similar
        const { data: existing } = await supabase
          .from('cobrancas')
          .select('id')
          .eq('cpf_cnpj', cobranca.cpf_cnpj)
          .eq('valor', cobranca.valor)
          .eq('vencimento', cobranca.vencimento)
          .limit(1);

        if (existing && existing.length > 0) {
          console.log('Registro já existe, pulando:', { cpf_cnpj: cobranca.cpf_cnpj, valor: cobranca.valor });
          skippedCount++;
          continue;
        }

        // Inserir novo registro
        const { error } = await supabase
          .from('cobrancas')
          .insert(cobranca);

        if (error) {
          console.error('Erro ao inserir cobrança:', error);
          // Continuar com outros registros mesmo se um falhar
        } else {
          insertedCount++;
        }
      } catch (error) {
        console.error('Erro ao processar cobrança:', error);
      }
    }

    console.log('Sincronização concluída:', { inseridos: insertedCount, ignorados: skippedCount });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${insertedCount} registros inseridos com sucesso${skippedCount > 0 ? `, ${skippedCount} registros já existiam e foram ignorados` : ''}`,
        processedCount: insertedCount,
        skippedCount: skippedCount,
        headers: headers
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na sincronização:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor: ' + error.message,
        details: 'Verifique se a URL da planilha está correta e se ela está acessível publicamente'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

function formatDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  // Tentar diferentes formatos de data
  const formats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY
    /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
    /(\d{1,2})-(\d{1,2})-(\d{4})/    // DD-MM-YYYY
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[1]) { // YYYY-MM-DD
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      } else { // DD/MM/YYYY ou DD-MM-YYYY
        return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
      }
    }
  }

  return new Date().toISOString().split('T')[0];
}

serve(handler);
