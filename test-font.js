import fs from 'fs';

const fetchFont = async (url) => {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
  console.log(base64.substring(0, 100));
};

fetchFont('https://fonts.gstatic.com/s/amiri/v26/J7a1npd8CGxZHp6rlWqA.ttf');
