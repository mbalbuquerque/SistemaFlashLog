const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Configuração do Banco - Ajuste a senha se houver
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'teste', 
    database: 'sistema_flashLog' 
});

db.connect(err => {
    if (err) console.error("❌ Erro no MySQL:", err.message);
    else console.log("✅ Conectado ao banco sistema_flashLog!");
});

// Rotas de Clientes
app.get('/clientes', (req, res) => {
    db.query("SELECT id, nome_fantasia, cnpj FROM clientes ORDER BY nome_fantasia", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

app.post('/clientes', (req, res) => {
    const { nome, cnpj } = req.body;
    db.query("INSERT INTO clientes (nome_fantasia, cnpj) VALUES (?, ?)", [nome, cnpj], (err) => {
        if (err) return res.status(500).send(err);
        res.sendStatus(201);
    });
});

// Relatório Detalhado (Corrigido)
app.get('/relatorio-detalhado', (req, res) => {
    const { inicio, fim, cliente_id } = req.query;
    
    let sql = `SELECT ch.id, c.nome_fantasia AS cliente, c.cnpj AS cliente_cnpj, 
               DATE_FORMAT(ch.data_servico, '%d/%m/%Y') AS data, 
               ch.responsavel_serico, ch.rota, ch.valor_cobrado AS valor, ch.descricao
               FROM chamados ch JOIN clientes c ON ch.cliente_id = c.id
               WHERE ch.data_servico BETWEEN ? AND ?`;
    
    let params = [inicio, fim];
    if (cliente_id) { sql += " AND ch.cliente_id = ?"; params.push(cliente_id); }
    sql += " ORDER BY ch.data_servico ASC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Lançar Chamado
app.post('/chamados', (req, res) => {
    const { cliente_id, data, responsavel, rota, descricao, valor } = req.body;
    const sql = "INSERT INTO chamados (cliente_id, data_servico, responsavel_serico, rota, descricao, valor_cobrado) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [cliente_id, data, responsavel, rota, descricao, valor], (err) => {
        if (err) return res.status(500).send(err);
        res.sendStatus(201);
    });
});

// Editar Chamado
app.put('/chamados/:id', (req, res) => {
    const { responsavel, rota, valor, descricao } = req.body;
    const sql = "UPDATE chamados SET responsavel_serico = ?, rota = ?, valor_cobrado = ?, descricao = ? WHERE id = ?";
    db.query(sql, [responsavel, rota, valor, descricao, req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.send("Atualizado");
    });
});

// Excluir Chamado
app.delete('/chamados/:id', (req, res) => {
    db.query("DELETE FROM chamados WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.send("Excluído");
    });
});

app.listen(3000, () => console.log("🚀 FlashLog rodando em http://localhost:3000"));