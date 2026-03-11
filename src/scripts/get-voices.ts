/**
 * Script para obtener voces disponibles de ElevenLabs
 */

import * as https from 'https';

const API_KEY = 'sk_b750e97123d8c731fd9fb05bc22ffc53f173b2626c6b1563';

function getAvailableVoices(): Promise<void> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.elevenlabs.io',
      path: '/v1/voices',
      method: 'GET',
      headers: {
        'xi-api-key': API_KEY,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const voices = JSON.parse(data);
            console.log('\n🎙️  VOCES DISPONIBLES EN ELEVENLABS:\n');
            console.log('='.repeat(80));

            // Filtrar voces masculinas y en español
            const maleVoices = voices.voices.filter((v: any) =>
              v.labels?.gender?.toLowerCase().includes('male') ||
              v.name.toLowerCase().includes('adam') ||
              v.name.toLowerCase().includes('antoni') ||
              v.name.toLowerCase().includes('marcus') ||
              v.name.toLowerCase().includes('daniel')
            );

            console.log('\n👨 VOCES MASCULINAS:\n');
            maleVoices.forEach((voice: any) => {
              console.log(`🎤 ${voice.name}`);
              console.log(`   ID: ${voice.voice_id}`);
              console.log(`   Idiomas: ${voice.labels?.accent || 'N/A'}`);
              console.log(`   Descripción: ${voice.description || 'N/A'}`);
              console.log('');
            });

            console.log('\n🎤 TODAS LAS VOCES:\n');
            voices.voices.forEach((voice: any) => {
              const gender = voice.labels?.gender || '?';
              const accent = voice.labels?.accent || '';
              console.log(`${gender === 'male' ? '👨' : gender === 'female' ? '👩' : '🎤'} ${voice.name} (${accent})`);
              console.log(`   ID: ${voice.voice_id}`);
              console.log('');
            });

            console.log('\n' + '='.repeat(80));
            console.log('✅ VOCES OBTENIDAS CORRECTAMENTE\n');
            resolve();
          } catch (error) {
            console.error('Error al parsear respuesta:', error);
            reject(error);
          }
        } else {
          console.error(`Error ${res.statusCode}: ${data}`);
          reject(new Error(`Error ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error en la petición:', error);
      reject(error);
    });

    req.end();
  });
}

getAvailableVoices()
  .then(() => {
    console.log('✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
