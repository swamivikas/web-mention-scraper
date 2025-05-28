const { useState } = React;

function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch('http://localhost:3000/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    React.createElement('div', { className: 'container' },
      React.createElement('h1', null, 'Web Mention Scraper'),
      React.createElement('form', { onSubmit: handleSubmit },
        React.createElement('input', {
          type: 'text',
          placeholder: 'Enter company or person…',
          value: query,
          onChange: (e) => setQuery(e.target.value),
        }),
        React.createElement('button', { type: 'submit', disabled: loading }, loading ? 'Crawling…' : 'Crawl')
      ),
      error && React.createElement('p', { className: 'error' }, error),
      data && React.createElement(Results, { data })
    )
  );
}

function Results({ data }) {
  return (
    React.createElement('div', { className: 'results' },
      React.createElement('h2', null, `LinkedIn mentions (last 7 days): ${data.last7DaysLinkedInMentions ?? 'N/A'}`),
      React.createElement('ul', null,
        data.mentions.map((m, idx) => (
          React.createElement('li', { key: idx },
            React.createElement('a', { href: m.link, target: '_blank', rel: 'noopener noreferrer' }, m.title),
            React.createElement('p', null, m.snippet)
          )
        ))
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App)); 