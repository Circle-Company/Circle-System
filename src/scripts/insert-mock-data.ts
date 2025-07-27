import { Sequelize, DataTypes } from 'sequelize';
import { mockPosts } from '../swipe-engine/data/mock-posts';
import { connection } from '../database';

async function insertMockData() {
  try {
    console.log('Conectando ao banco de dados...');
    await connection.authenticate();
    console.log('Conexão estabelecida com sucesso!');

    console.log('Criando tabelas se não existirem...');
    
    // Verificar e criar tabela de embeddings se não existir
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS swipe_post_embeddings (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          post_id VARCHAR(255) NOT NULL,
          vector TEXT NOT NULL,
          dimension INT NOT NULL DEFAULT 128,
          metadata JSON NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('Tabela swipe_post_embeddings verificada/criada com sucesso');
    } catch (error) {
      console.error('Erro ao criar tabela de embeddings:', error);
    }

    // Inserir posts mock
    console.log(`\nInserindo ${mockPosts.length} posts mock no banco...`);
    
    for (const post of mockPosts) {
      try {
        // Inserir embedding do post
        if (post.embedding && post.embedding.vector) {
          // Verificar se já existe
          const [rows] = await connection.query(
            'SELECT 1 FROM swipe_post_embeddings WHERE post_id = ?',
            [post.id]
          );
          
          if (Array.isArray(rows) && rows.length === 0) {
            // Inserir embedding
            await connection.query(
              `INSERT INTO swipe_post_embeddings 
               (post_id, vector, dimension, metadata)
               VALUES (?, ?, ?, ?)`,
              [
                post.id,
                JSON.stringify(post.embedding.vector.values),
                post.embedding.vector.dimension,
                JSON.stringify({
                  tags: post.tags || [],
                  statistics: post.statistics || { 
                    views: 0, 
                    likes: 0, 
                    comments: 0, 
                    shares: 0 
                  },
                  created_at: post.created_at,
                  userId: post.user_id
                })
              ]
            );
            console.log(`✅ Embedding inserido para post ${post.id}`);
          } else {
            console.log(`⏩ Embedding já existe para post ${post.id}`);
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao inserir post ${post.id}:`, error);
      }
    }

    console.log('\n✅ Dados mock inseridos com sucesso!');
    console.log(`Total de posts inseridos: ${mockPosts.length}`);
    
    // Verificar se os dados foram inseridos corretamente
    const [totalCount] = await connection.query(
      'SELECT COUNT(*) as count FROM swipe_post_embeddings'
    );
    console.log('Total de embeddings na tabela:', (totalCount as any)[0].count);
    
  } catch (error) {
    console.error('❌ Erro ao inserir dados mock:', error);
  } finally {
    await connection.close();
    console.log('Conexão com o banco fechada.');
  }
}

// Executar a função
insertMockData().catch(console.error); 