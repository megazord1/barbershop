// 1. CONFIGURAÇÃO DO SUPABASE
// Substitua com as credenciais reais do seu painel do Supabase (Project Settings > API)
const SUPABASE_URL = 'https://sryebanfwnbmsazsyxdc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TkSVYwSMcyVn5k4byo7cnQ_4ULn_jCB';

// Inicializa o cliente do Supabase que importamos via CDN no HTML
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. EVENTO PRINCIPAL: Roda assim que a página HTML terminar de carregar
document.addEventListener('DOMContentLoaded', () => {
    buscarFluxoCaixa();
});

// 3. FUNÇÃO PARA BUSCAR E RENDERIZAR OS DADOS
async function buscarFluxoCaixa() {
    try {
        // Busca todas as linhas da tabela 'fluxo_caixa' ordenadas pela data mais recente
        const { data: movimentacoes, error } = await supabase
            .from('fluxo_caixa')
            .select('*')
            .order('data_competencia', { ascending: false });

        if (error) throw error;

        // Seleciona os elementos do HTML onde vamos injetar os dados
        const tabelaBody = document.getElementById('tabela-fluxo');
        const cardDisponivel = document.getElementById('saldo-disponivel');
        const cardRetido = document.getElementById('saldo-retido');
        const cardLucro = document.getElementById('lucro-real');

        // Limpa a tabela antes de preencher (evita duplicar se a função rodar de novo)
        tabelaBody.innerHTML = '';

        // Variáveis acumuladoras para os cards de saldo
        let totalDisponivel = 0;
        let totalRetido = 0;
        let totalLucro = 0;

        // Loop para processar cada linha vinda do banco de dados
        movimentacoes.forEach(item => {
            const valorNumerico = parseFloat(item.valor);

            // Lógica de Acumulação dos Saldos para os Cards
            if (item.tipo === 'ENTRADA') {
                totalLucro += valorNumerico; // Entradas aumentam o lucro gerado
                
                if (item.status === 'efetivado') {
                    totalDisponivel += valorNumerico; // Dinheiro liberado no Mercado Pago
                } else {
                    totalRetido += valorNumerico; // Dinheiro retido (prazo de garantia de PF)
                }
            } else if (item.tipo === 'SAÍDA') {
                totalLucro -= valorNumerico; // Saídas (custos/despesas) diminuem o lucro
                
                if (item.status === 'efetivado') {
                    totalDisponivel -= valorNumerico; // Saídas efetivas reduzem o saldo em mãos
                }
            }

            // Criar a linha da tabela dinamicamente
            const linha = document.createElement('tr');
            
            // Formata a data de AAAA-MM-DD para DD/MM/AAAA
            const dataFormatada = new Date(item.data_competencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            
            // Define classes de cor baseadas no tipo (Entrada ou Saída)
            const classeTipo = item.tipo === 'ENTRADA' ? 'text-green' : 'text-red';
            const classeBadge = item.status === 'efetivado' ? 'badge-success' : 'badge-warning';

            linha.innerHTML = `
                <td>${dataFormatada}</td>
                <td>${item.descricao || item.categoria}</td>
                <td><strong class="${classeTipo}">${item.tipo}</strong></td>
                <td>${formatarMoeda(valorNumerico)}</td>
                <td><span class="badge ${classeBadge}">${item.status}</span></td>
            `;

            tabelaBody.appendChild(linha);
        });

        // Atualiza os valores dos cards na tela com os totais calculados
        cardDisponivel.textContent = formatarMoeda(totalDisponivel);
        cardRetido.textContent = formatarMoeda(totalRetido);
        cardLucro.textContent = formatarMoeda(totalLucro);

    } catch (error) {
        console.error('Erro ao carregar o fluxo de caixa:', error.message);
        alert('Erro ao conectar com o Supabase. Verifique o console.');
    }
}

// Helper: Função simples para formatar números no padrão de moeda Real (R$)
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}