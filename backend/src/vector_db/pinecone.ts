import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

export async function run(): Promise<void> {
  const indexName = process.env.PINECONE_INDEX_NAME!;
  
  const existingIndexes = await pc.listIndexes();
  const indexesList = existingIndexes.indexes ?? []; 
  if (!indexesList.some(idx => idx.name === indexName)) {
    console.log(`Creating index: ${indexName}`);
    await pc.createIndex({
      name: indexName,
      dimension: 3, // vector length
      metric: 'cosine',
      spec: { serverless: { cloud: 'aws', region: 'us-east-1' } }
    });

    console.log('Waiting for index to be ready...');
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  const index = pc.index(indexName);

  const upsertData = [
    {
      id: 'vec1',
      values: [0.1, 0.2, 0.3],
      metadata: { category: 'fruit', name: 'apple' }
    },
    {
      id: 'vec2',
      values: [0.2, 0.1, 0.4],
      metadata: { category: 'fruit', name: 'banana' }
    }
  ];

  console.log('Upserting vectors...');
  await index.upsert(upsertData);
  console.log('Data upserted.');

  console.log('Querying for similar vectors...');
  const queryResponse = await index.query({
    vector: [0.1, 0.2, 0.3],
    topK: 2,
    includeMetadata: true
  });

  (queryResponse.matches ?? []).forEach(match => {
    console.log(`ID: ${match.id}, Score: ${match.score}`);
    console.log('Metadata:', match.metadata);
  });
}

run().catch(err => {
  console.error('Error:', err);
});
