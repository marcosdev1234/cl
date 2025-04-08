const express = require('express');
const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
const multer = require('multer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const API_KEY = process.env.PUMP_API_KEY;

console.log('API_KEY en tokenRoutes.js:', API_KEY);

router.post('/create-token', upload.single('image'), async (req, res) => {
  try {
    console.log('Datos recibidos en el backend:');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file ? {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : 'No file received');

    const { name, ticker, description, amount, twitter, telegram, website } = req.body;
    const image = req.file;

    if (!name || !ticker || !description) {
      console.log('Campos faltantes detectados:', { name, ticker, description });
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos: name, ticker o description' });
    }
    if (!image) {
      return res.status(400).json({ success: false, error: 'La imagen es obligatoria' });
    }

    const mintKeypair = Keypair.generate();

    // Subir metadatos a IPFS
    const formData = new FormData();
    const blob = new Blob([image.buffer], { type: image.mimetype });
    formData.append('file', blob, image.originalname);
    formData.append('name', name);
    formData.append('symbol', ticker);
    formData.append('description', description);
    formData.append('twitter', twitter || '');
    formData.append('telegram', telegram || '');
    formData.append('website', website || '');
    formData.append('showName', 'true');

    console.log('Enviando solicitud a /api/ipfs con datos:', {
      name,
      symbol: ticker,
      description,
      image: image.originalname,
      twitter,
      telegram,
      website,
      showName: 'true'
    });

    const metadataResponse = await fetch('https://pump.fun/api/ipfs', {
      method: 'POST',
      body: formData
    });

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      throw new Error(`Error en /api/ipfs: ${metadataResponse.status} - ${errorText}`);
    }

    const metadataResponseJSON = await metadataResponse.json();
    console.log('Respuesta de /api/ipfs:', metadataResponseJSON);

    // Crear token
    console.log('Enviando solicitud a /trade con API_KEY:', API_KEY);
    const response = await fetch(`https://pumpportal.fun/api/trade?api-key=f116agtbb4t58rb391v3jv2rb0unjju599t42gum9nnkcavecdk6ajanb8rncku9a54k2g9b5dr4auj5cru6ycbc6x178yb984u7akahd1bqan33b55pahb76rup8j2gd0v5gnajewykuamrq4ubp6h23jmk95d3mmvhr8gedq62tk1cx9p6ju3ct7kaaukcrv7gchhah8kuf8`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'create',
        tokenMetadata: {
          name: metadataResponseJSON.metadata.name,
          symbol: metadataResponseJSON.metadata.symbol,
          uri: metadataResponseJSON.metadataUri
        },
        mint: bs58.default.encode(mintKeypair.secretKey), // Cambiado a bs58.default.encode
        denominatedInSol: 'true',
        amount: parseFloat(amount) || 0,
        slippage: 10,
        priorityFee: 0.0005,
        pool: 'pump'
      })
    });

    if (response.status === 200) {
      const data = await response.json();
      res.json({
        success: true,
        signature: data.signature,
        mint: mintKeypair.publicKey.toString()
      });
    } else {
      const errorText = await response.text();
      throw new Error(`Error en /trade: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Error completo:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;