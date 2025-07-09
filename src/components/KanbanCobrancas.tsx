import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
// Você pode trocar por uma lib de drag-and-drop mais avançada depois

const supabase = createClient(
  'https://kmgthlgycfdffskicirq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZ3RobGd5Y2ZkZmZza2ljaXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTcxNTQsImV4cCI6MjA2NjA5MzE1NH0.DTIOuJHQw5zdS-8wK8S8vDY6N74owQX_f1TqsCBcbak'
);

const COLUNAS = [
  { key: 'cobranca', label: 'Cobranças' },
  { key: 'corretor', label: 'C. Corretor' },
  { key: 'coordenador', label: 'C. Coordenador' },
  { key: 'internas', label: 'Cobrança Internas' },
  { key: 'reagendado', label: 'Reagendados' },
  { key: 'promessa', label: 'Promessa de Pagamento' },
  { key: 'finalizada', label: 'Finalizadas' },
];

export default function KanbanCobrancas() {
  const [cobrancas, setCobrancas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    fetchCobrancas();
    // Detecta dark mode
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark') || mql.matches);
    checkDark();
    mql.addEventListener('change', checkDark);
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      mql.removeEventListener('change', checkDark);
      observer.disconnect();
    };
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
    <div
      style={{
        width: '100%',
        margin: 0,
        padding: '24px 0',
        background: isDark ? '#23272f' : 'linear-gradient(90deg, #f8fafc 60%, #f1f5f9 100%)',
        borderRadius: 24,
        minHeight: 540,
        boxSizing: 'border-box',
        boxShadow: '0 8px 32px #0001',
        transition: 'background 0.3s',
        // overflowX: 'auto', // Removido para eliminar scroll horizontal
        display: 'flex',
        justifyContent: 'stretch',
        gap: 0,
      }}
      className="transition-colors kanban-proporcional"
    >
      {COLUNAS.map((col, idx) => (
        <div key={col.key} style={{
          flex: '1 1 0',
          minWidth: 180,
          maxWidth: 'none',
          width: `calc(100% / ${COLUNAS.length})`,
          background: idx % 2 === 0 ? '#f9fafb' : '#f3f4f6',
          borderRadius: 18,
          padding: 24,
          boxShadow: '0 4px 24px #0001',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 700,
          borderRight: idx < COLUNAS.length - 1 ? '2px solid #e2e8f0' : 'none',
          marginRight: 0,
          transition: 'box-shadow 0.2s',
        }}>
          <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 18, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 1 }}>{col.label}</h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {loading ? <p style={{ color: '#64748b' }}>Carregando...</p> : (
              cobrancas.filter(c => {
                if (col.key === 'cobranca') {
                  const etapasOutras = ['corretor','coordenador','internas','reagendado','promessa','finalizada'];
                  return (!c.status_kanban || c.status_kanban === '' || c.status_kanban === 'cobranca' || !etapasOutras.includes(c.status_kanban)) && c.status_pagamento !== 'pago';
                }
                return c.status_kanban === col.key;
              }).map(cobranca => (
                <div key={cobranca.id} style={{
                  background: '#fff',
                  padding: 14,
                  borderRadius: 12,
                  boxShadow: '0 2px 12px #0002',
                  cursor: 'pointer',
                  borderLeft: '4px solid #3b82f6',
                  fontSize: 14,
                  transition: 'box-shadow 0.2s, transform 0.15s',
                  marginBottom: 0,
                  marginTop: 0,
                  outline: 'none',
                  position: 'relative',
                  zIndex: 1
                }}
                onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 32px #3b82f633'; e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'; }}
                onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 12px #0002'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>{cobranca.cliente || cobranca.cliente_nome}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>Valor: <b>R$ {Number(cobranca.valor).toLocaleString()}</b></div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>Vencimento: {cobranca.vencimento ? new Date(cobranca.vencimento).toLocaleDateString() : '-'}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>Status: <b>{cobranca.status_pagamento === 'pago' ? 'Pago' : 'Em Aberto'}</b></div>
                  <div style={{ fontSize: 12, color: '#334155', marginTop: 6 }}>Assistente: {cobranca.assistente || cobranca.assistente_responsavel || '-'}</div>
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {COLUNAS.filter(col2 => col2.key !== col.key).map(col2 => (
                      <button key={col2.key} onClick={() => moverCobranca(cobranca.id, col2.key)} style={{ fontSize: 12, background: '#e0e7ef', border: 'none', borderRadius: 5, padding: '5px 10px', cursor: 'pointer', color: '#334155', transition: 'background 0.2s', fontWeight: 500, textAlign: 'left', width: '100%' }}>
                        Mover para {col2.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 