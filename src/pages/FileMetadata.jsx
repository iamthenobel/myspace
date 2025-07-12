import { useEffect, useState } from 'react';

export function useFileMetadata(fileId) {
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fileId) return;

    const token = localStorage.getItem('myspace_token');
    setLoading(true);

    fetch(`/api/files/${fileId}/metadata`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.details); });
        return res.json();
      })
      .then((data) => {
        setMetadata(data);
        setError('');
      })
      .catch((err) => {
        setError(err.message);
        setMetadata(null);
      })
      .finally(() => setLoading(false));
  }, [fileId]);

  return { metadata, error, loading };
}
