import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  QrCode, 
  Copy, 
  Download,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  DollarSign
} from 'lucide-react';

interface PixConfig {
  chavePix: string;
  tipoChave: 'email' | 'cpf' | 'cnpj' | 'telefone' | 'aleatoria';
  nomeRecebedor: string;
  cidadeRecebedor: string;
  cepRecebedor: string;
  ativo: boolean;
}

interface CobrancaPIX {
  id: string;
  cobranca_id: string;
  valor: number;
  chave_pix: string;
  qr_code: string;
  qr_code_text: string;
  status: 'pendente' | 'pago' | 'expirado';
  data_expiracao: string;
  created_at: string;
}

const IntegracaoPIX = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<PixConfig>({
    chavePix: '',
    tipoChave: 'email',
    nomeRecebedor: '',
    cidadeRecebedor: '',
    cepRecebedor: '',
    ativo: false
  });
  const [cobrancasPix, setCobrancasPix] = useState<CobrancaPIX[]>([]);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const tiposChave = [
    { value: 'email', label: 'Email' },
    { value: 'cpf', label: 'CPF' },
    { value: 'cnpj', label: 'CNPJ' },
    { value: 'telefone', label: 'Telefone' },
    { value: 'aleatoria', label: 'Chave Aleatória' }
  ];

  const salvarConfig = async () => {
    setSalvando(true);
    try {
      const { error } = await supabase
        .from('configuracoes_pix')
        .upsert({
          user_id: user?.id,
          chave_pix: config.chavePix,
          tipo_chave: config.tipoChave,
          nome_recebedor: config.nomeRecebedor,
          cidade_recebedor: config.cidadeRecebedor,
          cep_recebedor: config.cepRecebedor,
          ativo: config.ativo
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração PIX salva com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração PIX",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  const gerarPIX = async (cobrancaId: string, valor: number) => {
    setLoading(true);
    try {
      // Simular geração de PIX
      await new Promise(resolve => setTimeout(resolve, 2000));

      const pixData = {
        cobranca_id: cobrancaId,
        valor: valor,
        chave_pix: config.chavePix,
        qr_code: `data:image/png;base64,${btoa('QR_CODE_SIMULADO')}`,
        qr_code_text: `00020126580014br.gov.bcb.pix0136${config.chavePix}520400005303986540510.005802BR5913${config.nomeRecebedor}6008${config.cidadeRecebedor}62070503***6304ABCD`,
        status: 'pendente',
        data_expiracao: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      const { error } = await supabase
        .from('cobrancas_pix')
        .insert(pixData);

      if (error) throw error;

      toast({
        title: "PIX Gerado",
        description: "QR Code PIX gerado com sucesso!",
      });

      // Recarregar lista
      carregarCobrancasPIX();
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PIX",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarCobrancasPIX = async () => {
    try {
      const { data, error } = await supabase
        .from('cobrancas_pix')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setCobrancasPix(data || []);
    } catch (error) {
      console.error('Erro ao carregar cobranças PIX:', error);
    }
  };

  const copiarQRCode = async (qrCodeText: string) => {
    try {
      await navigator.clipboard.writeText(qrCodeText);
      toast({
        title: "Copiado",
        description: "QR Code copiado para a área de transferência",
      });
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const baixarQRCode = (qrCode: string, cobrancaId: string) => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `pix_${cobrancaId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'expirado':
        return <Badge className="bg-red-100 text-red-800">Expirado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuração PIX */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Configuração PIX
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Chave</Label>
              <Select 
                value={config.tipoChave} 
                onValueChange={(value) => setConfig({...config, tipoChave: value as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposChave.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Chave PIX</Label>
              <Input
                placeholder="Digite sua chave PIX"
                value={config.chavePix}
                onChange={(e) => setConfig({...config, chavePix: e.target.value})}
              />
            </div>

            <div>
              <Label>Nome do Recebedor</Label>
              <Input
                placeholder="Nome completo"
                value={config.nomeRecebedor}
                onChange={(e) => setConfig({...config, nomeRecebedor: e.target.value})}
              />
            </div>

            <div>
              <Label>Cidade</Label>
              <Input
                placeholder="Cidade"
                value={config.cidadeRecebedor}
                onChange={(e) => setConfig({...config, cidadeRecebedor: e.target.value})}
              />
            </div>

            <div>
              <Label>CEP</Label>
              <Input
                placeholder="00000-000"
                value={config.cepRecebedor}
                onChange={(e) => setConfig({...config, cepRecebedor: e.target.value})}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={config.ativo}
                onCheckedChange={(checked) => setConfig({...config, ativo: checked})}
              />
              <Label>PIX Ativo</Label>
            </div>
          </div>

          <Button 
            onClick={salvarConfig}
            disabled={salvando || !config.chavePix || !config.nomeRecebedor}
            className="flex items-center gap-2"
          >
            {salvando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Settings className="w-4 h-4" />
            )}
            {salvando ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </CardContent>
      </Card>

      {/* Gerador de PIX */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Gerador de PIX
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>ID da Cobrança</Label>
              <Input
                placeholder="UUID da cobrança"
                id="cobrancaId"
              />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                id="valorPix"
              />
            </div>
          </div>

          <Button 
            onClick={() => {
              const cobrancaId = (document.getElementById('cobrancaId') as HTMLInputElement).value;
              const valor = parseFloat((document.getElementById('valorPix') as HTMLInputElement).value);
              
              if (!cobrancaId || !valor) {
                toast({
                  title: "Erro",
                  description: "Preencha todos os campos",
                  variant: "destructive",
                });
                return;
              }

              gerarPIX(cobrancaId, valor);
            }}
            disabled={loading || !config.ativo}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <QrCode className="w-4 h-4" />
            )}
            {loading ? 'Gerando PIX...' : 'Gerar PIX'}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de PIX Gerados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            PIX Gerados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cobrancasPix.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <QrCode className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>Nenhum PIX gerado</p>
              <p className="text-sm">Use o gerador acima para criar PIX</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cobrancasPix.map((pix) => (
                <Card key={pix.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-semibold">PIX #{pix.id.slice(0, 8)}</h5>
                          {getStatusBadge(pix.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Valor:</span> R$ {pix.valor.toFixed(2)}
                          </div>
                          <div>
                            <span className="font-medium">Cobrança:</span> {pix.cobranca_id.slice(0, 8)}
                          </div>
                          <div>
                            <span className="font-medium">Chave:</span> {pix.chave_pix}
                          </div>
                          <div>
                            <span className="font-medium">Criado:</span> {new Date(pix.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copiarQRCode(pix.qr_code_text)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => baixarQRCode(pix.qr_code, pix.id)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegracaoPIX; 