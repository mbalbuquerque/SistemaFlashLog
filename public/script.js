let dadosGlobais = [];



function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    if (id === 'chamado' || id === 'relatorio') carregarClientes(id === 'chamado' ? 'selectCliente' : 'filtroCliente');
}
// Salvar Novo Cliente
document.getElementById('formCliente').onsubmit = async (e) => {
    e.preventDefault(); // Impede a página de recarregar
    
    const dados = {
        nome: document.getElementById('nome').value,
        cnpj: document.getElementById('cnpj').value
    };

    try {
        const response = await fetch('http://localhost:3000/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            alert("✅ Cliente cadastrado com sucesso!");
            e.target.reset(); // Limpa o formulário
            carregarClientes('selectCliente'); // Atualiza a lista de chamados
        } else {
            alert("❌ Erro ao salvar cliente no servidor.");
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("❌ Servidor offline ou erro de conexão.");
    }
};


async function carregarClientes(idSelect) {
    const res = await fetch('http://localhost:3000/clientes');
    const dados = await res.json();
    const select = document.getElementById(idSelect);
    select.innerHTML = idSelect === 'filtroCliente' ? '<option value="">Todos os Clientes</option>' : '<option value="">Selecione...</option>';
    dados.forEach(c => select.innerHTML += `<option value="${c.id}">${c.nome_fantasia}</option>`);
}

// Lançar Chamado
document.getElementById('formChamado').onsubmit = async (e) => {
    e.preventDefault();
    const payload = {
        cliente_id: document.getElementById('selectCliente').value,
        data: document.getElementById('data_manual').value,
        responsavel: document.getElementById('responsavel_servico').value,
        rota: document.getElementById('rota').value,
        valor: document.getElementById('valor').value,
        descricao: document.getElementById('descricao_servico').value
    };
    await fetch('http://localhost:3000/chamados', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    });
    alert("✅ Registrado!"); e.target.reset();
};

async function visualizarRelatorio() {
    const ini = document.getElementById('dataInicio').value;
    const fim = document.getElementById('dataFim').value;
    const cli = document.getElementById('filtroCliente').value;
    if(!ini || !fim) return alert("Selecione as datas!");

    const res = await fetch(`http://localhost:3000/relatorio-detalhado?inicio=${ini}&fim=${fim}&cliente_id=${cli}`);
    dadosGlobais = await res.json();
    
    const corpo = document.getElementById('corpoPrevia');
    corpo.innerHTML = "";
    let total = 0;

    dadosGlobais.forEach(i => {
        total += parseFloat(i.valor);
        corpo.innerHTML += `
            <tr>
                <td>${i.data}</td>
                <td>${i.rota}</td>
                <td>R$ ${parseFloat(i.valor).toFixed(2)}</td>
                <td>${i.responsavel_serico || '-'}</td>
                <td>
                    <button class="btn-edit" onclick="editarChamado(${i.id}, '${i.responsavel_serico}', '${i.rota}', ${i.valor}, '${i.descricao}')">✏️</button>
                    <button class="btn-delete" onclick="excluirChamado(${i.id})">🗑️</button>
                </td>
            </tr>`;
    });
    document.getElementById('pePrevia').innerHTML = `<tr><td colspan="2">TOTAL</td><td colspan="3">R$ ${total.toFixed(2)}</td></tr>`;
    document.getElementById('tabelaPrevia').style.display = "table";
}

async function editarChamado(id, responsavel, rota, valor, desc) {
    const nResp = prompt("Novo Solicitante:", responsavel);
    const nRota = prompt("Nova Rota:", rota);
    const nVal = prompt("Novo Valor:", valor);
    const nDesc = prompt("Nova Descrição:", desc);
    
    if (nResp && nRota && nVal) {
        await fetch(`http://localhost:3000/chamados/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ responsavel: nResp, rota: nRota, valor: nVal, descricao: nDesc })
        });
        visualizarRelatorio();
    }
}

async function excluirChamado(id) {
    if(confirm("Deseja realmente excluir este lançamento?")) {
        await fetch(`http://localhost:3000/chamados/${id}`, { method: 'DELETE' });
        visualizarRelatorio();
    }
}

async function gerarRelatorioPDF() {
    if (dadosGlobais.length === 0) return alert("Gere a prévia primeiro!");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    try { doc.addImage("logo 2 png.png", 'PNG', 10, 10, 35, 12); } catch(e) {}

    const info = dadosGlobais[0];
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Flash Logística", 50, 15);
    doc.setFontSize(12);
    doc.text("CNPJ: 30.981.588/0001-72", 50, 21);

    const pageWidth = doc.internal.pageSize.width;
    doc.setFont("helvetica", "normal");
    doc.text(`PRODUÇÃO: ${info.cliente}`, pageWidth - 10, 15, { align: "right" });
    doc.text(`CNPJ CLIENTE: ${info.cliente_cnpj || '-'}`, pageWidth - 10, 21, { align: "right" });

    const rows = dadosGlobais.map(i => [i.data, i.rota, `R$ ${parseFloat(i.valor).toFixed(2)}`, i.descricao || '-', i.responsavel_serico || '-']);
    const total = dadosGlobais.reduce((a, b) => a + parseFloat(b.valor), 0);
    rows.push(['', 'TOTAL GERAL', `R$ ${total.toFixed(2)}`, '', '']);

    doc.autoTable({
        startY: 32,
        head: [['DATA', 'ROTA', 'VALOR', 'OBS', 'SOLICITANTE']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [24, 22, 18], textColor: [242, 104, 0] }
    });
    doc.save(`Relatorio_FlashLog_${info.cliente}.pdf`);
}