#![cfg(target_arch = "wasm32")]

use blur::{ApplyBlurOptions, BlurPass};
use gpu::wgpu;
use js_sys::Object;

use wasm_bindgen::{JsCast, JsValue, prelude::wasm_bindgen};

use crate::gpu::{
    import_canvas_texture, read_offscreen_canvas_property, read_serde_property, read_u32_property,
    render_texture_to_canvas, with_gpu_runtime,
};

struct ApplyBackgroundBlurOptions {
    source: wgpu::web_sys::OffscreenCanvas,
    width: u32,
    height: u32,
    passes: Vec<BlurPass>,
}

#[wasm_bindgen(js_name = applyBlurPasses)]
pub fn apply_background_blur(options: JsValue) -> Result<wgpu::web_sys::OffscreenCanvas, JsValue> {
    let ApplyBackgroundBlurOptions {
        source,
        width,
        height,
        passes,
    } = parse_apply_background_blur_options(options)?;

    with_gpu_runtime(|runtime| {
        let source_texture = import_canvas_texture(
            &runtime.context,
            &source,
            width,
            height,
            "blur-input-texture",
        );
        let blur_passes = passes;
        let result_texture = runtime
            .blur
            .apply(
                &runtime.context,
                ApplyBlurOptions {
                    source: &source_texture,
                    width,
                    height,
                    passes: &blur_passes,
                },
            )
            .map_err(|error| JsValue::from_str(&error.to_string()))?;
        render_texture_to_canvas(&runtime.context, &result_texture, width, height)
    })
}

fn parse_apply_background_blur_options(value: JsValue) -> Result<ApplyBackgroundBlurOptions, JsValue> {
    let object: Object = value
        .dyn_into()
        .map_err(|_| JsValue::from_str("applyBlurPasses expects an options object"))?;

    Ok(ApplyBackgroundBlurOptions {
        source: read_offscreen_canvas_property(&object, "source")?,
        width: read_u32_property(&object, "width")?,
        height: read_u32_property(&object, "height")?,
        passes: read_serde_property(&object, "passes")?,
    })
}
