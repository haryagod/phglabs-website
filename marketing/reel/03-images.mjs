// Step 3: local image engine (ComfyUI + DreamShaper XL Turbo + Real-ESRGAN) -> vertical 1080x1920 backgrounds.
import fs from 'node:fs';
const COMFY = 'http://127.0.0.1:8188';
const style = 'cinematic photograph, shallow depth of field, soft volumetric light, rich colors, 35mm, highly detailed, professional advertising photography';
const negative = 'text, letters, words, watermark, logo, signature, people, person, face, hands, blurry, lowres, deformed, cartoon, oversaturated';
const shots = {
  hook: 'close-up of a cluttered wooden shop counter in a small Indian store, stacks of old handwritten paper ledgers and notebooks, scattered receipts, a pen, warm tungsten light, dusty, moody',
  problem: 'messy pile of crumpled paper bills, receipts and invoices on a dark desk, a calculator, dramatic low-key lighting, deep shadows, tension',
  ayuros: 'serene modern Ayurvedic clinic interior, brass mortar and pestle, fresh green herbs, copper vessels, glass jars of powders, wooden shelves, warm morning sunlight, calm and premium',
  shopstock: 'bright, neatly organized modern Indian retail grocery store aisle, colorful products perfectly arranged on shelves, clean, inviting, soft daylight',
  custom: 'sleek developer desk at night, laptop and phone glowing with abstract code and app interface, indigo and cyan neon light, bokeh city lights through window, futuristic',
  cta: 'abstract glowing network of connected nodes and lines, deep navy background, indigo and cyan light trails, elegant technology background, depth of field',
};
const only = process.argv.slice(2);
fs.mkdirSync('build/img', { recursive: true });
for (const [id, scene] of Object.entries(shots)) {
  if (only.length && !only.includes(id)) continue;
  const seed = Math.floor(Math.random() * 1e9);
  const g = {
    ckpt: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'DreamShaperXL_Turbo_v2_1.safetensors' } },
    latent: { class_type: 'EmptyLatentImage', inputs: { width: 768, height: 1344, batch_size: 2 } },
    pos: { class_type: 'CLIPTextEncode', inputs: { text: `${scene}, ${style}`, clip: ['ckpt', 1] } },
    neg: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['ckpt', 1] } },
    sample: { class_type: 'KSampler', inputs: { seed, steps: 8, cfg: 2, sampler_name: 'dpmpp_sde', scheduler: 'karras', denoise: 1,
      model: ['ckpt', 0], positive: ['pos', 0], negative: ['neg', 0], latent_image: ['latent', 0] } },
    decode: { class_type: 'VAEDecode', inputs: { samples: ['sample', 0], vae: ['ckpt', 2] } },
    upModel: { class_type: 'UpscaleModelLoader', inputs: { model_name: 'RealESRGAN_x4plus.pth' } },
    upscale: { class_type: 'ImageUpscaleWithModel', inputs: { upscale_model: ['upModel', 0], image: ['decode', 0] } },
    resize: { class_type: 'ImageScale', inputs: { image: ['upscale', 0], upscale_method: 'lanczos', width: 1296, height: 2304, crop: 'center' } },
    save: { class_type: 'SaveImage', inputs: { filename_prefix: `phg-reel-${id}`, images: ['resize', 0] } },
  };
  const { prompt_id } = await (await fetch(`${COMFY}/prompt`, { method: 'POST', body: JSON.stringify({ prompt: g }) })).json();
  let out;
  while (!(out = (await (await fetch(`${COMFY}/history/${prompt_id}`)).json())[prompt_id])) await new Promise((r) => setTimeout(r, 500));
  const imgs = out.outputs.save.images;
  for (const [i, im] of imgs.entries()) {
    const buf = Buffer.from(await (await fetch(`${COMFY}/view?filename=${encodeURIComponent(im.filename)}&type=output`)).arrayBuffer());
    fs.writeFileSync(`build/img/${id}-${i}.png`, buf);
  }
  console.log(id, 'seed', seed, imgs.length, 'images');
}
