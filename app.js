// 1. CONFIGURAÇÃO DAS CREDENCIAIS DO BANCO
// Substitua com os links exatos do painel do seu Supabase
const SUPABASE_URL = 'https://sryebanfwnbmsazsyxdc.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_TkSVYwSMcyVn5k4byo7cnQ_4ULn_jCB';     

// Inicialização segura usando a biblioteca trazida pelo link do CDN do HTML
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. DISPARAR QUANDO A TELA CARREGAR
document.addEventListener('DOMContentLoaded', () => {
    buscarFluxoCaixa();
});

// 3. BUSCA E EXIBIÇÃO FINANCEIRA
async function buscarFluxoCaixa() {
    try {
        // Puxa as movimentações ordenadas pela data
        const { data: movimentacoes, error } = await supabase
            .from('fluxo_caixa')
            .select('*')
            .order('data_competencia', { ascending: false });

        if (error) throw error;

        // Mapeamento dos elementos do HTML
        const tabelaBody = document.getElementById('tabela-fluxo');
        const cardDisponivel = document.getElementById('saldo-disponivel');
        const cardRetido = document.getElementById('saldo-retido');
        const cardLucro = document.getElementById('lucro-real');

        if (!tabelaBody) return; // Proteção caso o HTML ainda não tenha renderizado a tabela

        tabelaBody.innerHTML = '';

        let totalDisponivel = 0;
        let totalRetido = 0;
        let totalLucro = 0;

        movimentacoes.forEach(item => {
            const valorNumerico = parseFloat(item.valor);

            // Soma e subtração baseada no tipo de movimentação
            if (item.tipo === 'ENTRADA') {
                totalLucro += valorNumerico;
                if (item.status === 'efetivado') {
                    totalDisponivel += valorNumerico;
                } else {
                    totalRetido += valorNumerico;
                }
            } else if (item.tipo === 'SAÍDA') {
                totalLucro -= valorNumerico;
                if (item.status === 'efetivado') {
                    totalDisponivel -= valorNumerico;
                }
            }

            // Criação das linhas na tabela
            const linha = document.createElement('tr');
            const dataFormatada = new Date(item.data_competencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
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

        // Atualização dos números nos cards
        if (cardDisponivel) cardDisponivel.textContent = formatarMoeda(totalDisponivel);
        if (cardRetido) cardRetido.textContent = formatarMoeda(totalRetido);
        if (cardLucro) cardLucro.textContent = formatarMoeda(totalLucro);

    } catch (error) {
        console.error('Erro na requisição do Supabase:', error.message);
    }
}

// Auxiliar para formatação monetária brasileira
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}