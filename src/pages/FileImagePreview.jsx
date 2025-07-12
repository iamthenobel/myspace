import { useEffect, useState } from 'react';

export default function FileImagePreview({ file, onClick }) {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('myspace_token');
    let objectUrl = null;

    fetch(`/api/files/${file.id}/view`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.blob())
      .then(blob => {
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.id]);

  if (!imageUrl) return null;

  return (
    <img
      src={imageUrl}
      alt={file.name}
      className="max-h-full max-w-full object-contain cursor-pointer"
      onClick={onClick}
    />
  );
}
