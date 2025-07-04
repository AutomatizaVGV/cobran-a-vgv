
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileSpreadsheet, Download, CheckCircle, AlertCircle, Info } from 'lucide-react';

const GoogleSheetsConfig = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [config, setConfig] = useState({
    spreadsheetId: '',
    range: 'Sheet1!A:I',
    columnMapping: {
      cliente_nome: 'Cliente',
      cpf_cnpj: 'CPF/CNPJ',
      valor: 'Valor',
      vencimento: 'Vencimento',
      empreendimento: 'Empreendimento',
      produto: 'Produto',
      status_cliente: 'Status Cliente',
      tipo_cobranca: 'Tipo Cobrança',
      quantidade_parcelas: 'Quantidade de Parcelas'
    }
  });

  const handleSync = async () => {
    if (!config.spreadsheetId) {
      toast({
        title: "Erro",
        description: "Por favor, insira o ID da planilha",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setLastError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-sheets', {
        body: {
          spreadsheetId: config.spreadsheetId,
          range: config.range,
          columnMapping: config.columnMapping
        }
      });

      if (error) throw error;

      if (data.error) {
        setLastError(data.error);
        toast({
          title: "Erro na sincronização",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: data.message || "Sincronização concluída com sucesso",
      });

      // Mostrar informações adicionais se disponíveis
      if (data.headers) {
        console.log('Cabeçalhos encontrados:', data.headers);
      }

      // Recarregar a página para mostrar os novos dados
      setTimeout(() => window.location.reload(), 1000);

    } catch (error) {
      console.error('Erro na sincronização:', error);
      const errorMessage = error.message || 'Erro desconhecido';
      setLastError(errorMessage);
      
      toast({
        title: "Erro",
        description: "Erro ao sincronizar com Google Sheets: " + errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const extractSpreadsheetId = (url: string) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
  };

  const handleUrlChange = (url: string) => {
    const id = extractSpreadsheetId(url);
    setConfig(prev => ({ ...prev, spreadsheetId: id }));
    setLastError(null); // Limpar erro ao mudar URL
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Integração Google Sheets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {lastError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Erro:</strong> {lastError}
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Como configurar:</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Abra sua planilha no Google Sheets</li>
            <li>2. Clique em "Compartilhar" e configure como "Qualquer pessoa com o link"</li>
            <li>3. Copie a URL da planilha e cole abaixo</li>
            <li>4. Configure o nome da aba no campo "Intervalo" (ex: MinhaAba!A:I)</li>
            <li>5. Configure o mapeamento das colunas se necessário</li>
            <li>6. Clique em "Sincronizar dados"</li>
          </ol>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Detecção Automática:</strong> O sistema tentará detectar automaticamente o nome das abas da sua planilha. 
            Se o nome "Sheet1" não existir, ele usará a primeira aba disponível.
          </AlertDescription>
        </Alert>

        <div className="bg-amber-50 p-4 rounded-lg">
          <h4 className="font-semibold text-amber-900 mb-2">Estrutura esperada da planilha:</h4>
          <div className="text-sm text-amber-800 grid grid-cols-1 md:grid-cols-2 gap-1">
            <div>• Coluna A: Cliente</div>
            <div>• Coluna B: CPF/CNPJ</div>
            <div>• Coluna C: Valor</div>
            <div>• Coluna D: Vencimento</div>
            <div>• Coluna E: Empreendimento</div>
            <div>• Coluna F: Produto</div>
            <div>• Coluna G: Status Cliente</div>
            <div>• Coluna H: Tipo Cobrança</div>
            <div>• <strong>Coluna I: Quantidade de Parcelas</strong></div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="spreadsheet-url">URL da Planilha Google Sheets</Label>
            <Input
              id="spreadsheet-url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              onChange={(e) => handleUrlChange(e.target.value)}
            />
            {config.spreadsheetId && (
              <p className="text-sm text-green-600 mt-1">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                ID extraído: {config.spreadsheetId}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="range">Intervalo (ex: NomeDaAba!A:I)</Label>
            <Input
              id="range"
              value={config.range}
              onChange={(e) => setConfig(prev => ({ ...prev, range: e.target.value }))}
              placeholder="Sheet1!A:I"
            />
            <p className="text-sm text-slate-600 mt-1">
              Substitua "Sheet1" pelo nome real da sua aba. Ex: "Dados!A:I", "Planilha1!A:I"
            </p>
          </div>

          <div>
            <Label>Mapeamento de Colunas (JSON)</Label>
            <Textarea
              value={JSON.stringify(config.columnMapping, null, 2)}
              onChange={(e) => {
                try {
                  const mapping = JSON.parse(e.target.value);
                  setConfig(prev => ({ ...prev, columnMapping: mapping }));
                } catch (error) {
                  // Ignorar erro de parsing durante a digitação
                }
              }}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-sm text-slate-600 mt-1">
              Configure o nome das colunas na sua planilha que correspondem a cada campo
            </p>
          </div>
        </div>

        <Button 
          onClick={handleSync} 
          disabled={loading || !config.spreadsheetId}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Sincronizar Dados
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsConfig;
