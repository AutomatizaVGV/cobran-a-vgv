import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
// Você pode trocar por uma lib de drag-and-drop mais avançada depois

const supabase = createClient(
  'https://kmgthlgycfdffskicirq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZ3RobGd5Y2ZkZmZza2ljaXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTcxNTQsImV4cCI6MjA2NjA5MzE1NH0.DTIOuJHQw5zdS-8wK8S8vDY6N74owQX_f1TqsCBcbak'
);

const COLUNAS = [
  { key: 'a_contatar', label: 'A Contatar' },
  { key: 'em_andamento', label: 'Contato em Andamento' },
  { key: 'contactado', label: 'Contactado/Promessa' },
  { key: 'remarcado', label: 'Remarcados/Agendados' },
  { key: 'quitado', label: 'Quitados/Finalizados' },
];

export default function KanbanCobrancas() {
  const [cobrancas, setCobrancas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCobrancas();
  }, []);

  async function fetchCobrancas() {
    setLoading(true);
    const { data, error } = await supabase.from('cobrancas').select('*');
    if (!error) setCobrancas(data);
    setLoading(false);
  }

  async function moverCobranca(id, novoStatus) {
    await supabase.from('cobrancas').update({ status_kanban: novoStatus }).eq('id', id);
    fetchCobrancas();
  }

  return (
    <div style={{ display: 'flex', gap: 16, overflowX: 'auto' }}>
      {COLUNAS.map(col => (
        <div key={col.key} style={{ minWidth: 300, background: '#f4f4f4', borderRadius: 8, padding: 8 }}>
          <h3>{col.label}</h3>
          {loading ? <p>Carregando...</p> : (
            cobrancas.filter(c => c.status_kanban === col.key).map(cobranca => (
              <div key={cobranca.id} style={{ background: '#fff', margin: 8, padding: 8, borderRadius: 4, boxShadow: '0 1px 4px #0001' }}>
                <strong>{cobranca.cliente}</strong><br/>
                Valor: R$ {cobranca.valor}<br/>
                Vencimento: {cobranca.vencimento}<br/>
                Assistente: {cobranca.assistente}<br/>
                <div style={{ marginTop: 8 }}>
                  {COLUNAS.filter(col2 => col2.key !== cobranca.status_kanban).map(col2 => (
                    <button key={col2.key} onClick={() => moverCobranca(cobranca.id, col2.key)} style={{ marginRight: 4, fontSize: 12 }}>
                      Mover para {col2.label}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
} 