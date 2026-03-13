/**
 * Script para mostrar todas las voces disponibles de ElevenLabs
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
            console.log('\n' + '='.repeat(90));
            console.log('🎙️  TODAS LAS VOCES DISPONIBLES EN ELEVENLABS');
            console.log('='.repeat(90) + '\n');

            // Agrupar por género
            const maleVoices = voices.voices.filter((v: any) =>
              v.labels?.gender?.toLowerCase().includes('male')
            );
            const femaleVoices = voices.voices.filter((v: any) =>
              v.labels?.gender?.toLowerCase().includes('female')
            );
            const neutralVoices = voices.voices.filter((v: any) =>
              !v.labels?.gender || (!v.labels.gender.toLowerCase().includes('male') && !v.labels.gender.toLowerCase().includes('female'))
            );

            // VOCES FEMENINAS
            console.log('👩 VOCES FEMENINAS (' + femaleVoices.length + ')\n');
            femaleVoices.forEach((voice: any) => {
              console.log(`🎙️  ${voice.name}`);
              console.log(`   ID: ${voice.voice_id}`);
              console.log(`   Acento: ${voice.labels?.accent || 'N/A'}`);
              console.log(`   Edad: ${voice.labels?.age || 'N/A'}`);
              console.log(`   Descripción: ${voice.description || 'Sin descripción'}`);
              console.log('');
            });

            // VOCES MASCULINAS
            console.log('👨 VOCES MASCULINAS (' + maleVoices.length + ')\n');
            maleVoices.forEach((voice: any) => {
              console.log(`🎙️  ${voice.name}`);
              console.log(`   ID: ${voice.voice_id}`);
              console.log(`   Acento: ${voice.labels?.accent || 'N/A'}`);
              console.log(`   Edad: ${voice.labels?.age || 'N/A'}`);
              console.log(`   Descripción: ${voice.description || 'Sin descripción'}`);
              console.log('');
            });

            // VOCES NEUTRALES/SIN GÉNERO
            console.log('🎤 VOCES NEUTRALES (' + neutralVoices.length + ')\n');
            neutralVoices.forEach((voice: any) => {
              console.log(`🎙️  ${voice.name}`);
              console.log(`   ID: ${voice.voice_id}`);
              console.log(`   Descripción: ${voice.description || 'Sin descripción'}`);
              console.log('');
            });

            console.log('='.repeat(90));
            console.log(`✅ TOTAL: ${voices.voices.length} voces disponibles\n`);
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
