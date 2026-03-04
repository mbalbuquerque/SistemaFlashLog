CREATE DATABASE sistema_FlashLog;
USE sistema_FlashLog;

-- Tabela de Clientes
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_fantasia VARCHAR(150) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(100),
    responsavel_chamado VARCHAR(100), -- O contato principal
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Roteiro/Serviços (Onde ficam os preços tabelados)
CREATE TABLE roteiros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao_servico VARCHAR(255) NOT NULL,
    valor_unitario DECIMAL(10, 2) NOT NULL
);

-- Tabela de Chamados/Produção (Relaciona Cliente + Roteiro)
CREATE TABLE chamados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT,
    roteiro_id INT,
    descricao int,
    quantidade INT DEFAULT 1,
    data_servico DATE,
    valor_cobrado DECIMAL(10, 2), -- Valor no momento do chamado
    status ENUM('Aberto', 'Finalizado', 'Cancelado') DEFAULT 'Finalizado',
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (roteiro_id) REFERENCES roteiros(id)
);

SELECT 
    c.nome_fantasia,
    COUNT(ch.id) AS total_chamados,
    SUM(ch.valor_cobrado * ch.quantidade) AS valor_total_final
FROM chamados ch
JOIN clientes c ON ch.cliente_id = c.id
WHERE ch.data_servico BETWEEN '2023-01-01' AND '2023-12-31' -- Exemplo de filtro
GROUP BY c.id;

ALTER TABLE chamados 
ADD COLUMN rota VARCHAR(100),
ADD COLUMN descricao VARCHAR(255);

show tables;

USE sistema_servicos;

ALTER TABLE chamados;
ADD COLUMN IF NOT EXISTS rota VARCHAR(100),
ADD COLUMN IF NOT EXISTS descricao VARCHAR(255);

/* 1. Entrar no banco correto */
USE sistema_FlashLog;

/* 2. Adicionar a coluna rota */
ALTER TABLE chamados ADD rota VARCHAR(100);

/* 3. Adicionar a coluna descricao */
ALTER TABLE chamados ADD descricao VARCHAR(255);

ALTER TABLE chamados ADD responsavel_serico VARCHAR(255);

use sistema_FlashLog;