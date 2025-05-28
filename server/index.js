import express from 'express';
import cors from 'cors';
import { crawlWeb } from './crawler.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send({ message: 'Web mention scraper API is running.' });
});

app.post('/api/crawl', async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter in request body.' });
  }

  try {
    const data = await crawlWeb(query);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to crawl web.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 