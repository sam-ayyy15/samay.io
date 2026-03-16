const crypto = require("crypto");
const fs = require("fs");

const decryptFile = (inputFile, outputFile, password) => {
  const key = crypto.createHash("sha256").update(password).digest();

  // Read the IV from the first 16 bytes
  const fd = fs.openSync(inputFile, "r");
  const iv = Buffer.alloc(16);
  fs.readSync(fd, iv, 0, 16, 0);
  fs.closeSync(fd);

  // Stream the rest (after the 16-byte IV) through the decipher
  const input = fs.createReadStream(inputFile, { start: 16 });
  const output = fs.createWriteStream(outputFile);
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

  input.pipe(decipher).pipe(output);

  output.on("finish", () => {
    const size = fs.statSync(outputFile).size;
    console.log("Decrypted successfully:", outputFile, "size:", size, "bytes");
  });
  output.on("error", (err) => console.error("Error:", err));
  input.on("error", (err) => console.error("Input error:", err));
};

decryptFile("character.enc", "character.glb", "Character3D#@");
