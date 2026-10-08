use serde::{Deserialize, Serialize};
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BlurPass {pub sigma:f32,pub step:f32,pub direction:[f32;2]}
