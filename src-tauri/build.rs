fn main() {
    let dist = std::path::Path::new("../dist");
    if !dist.exists() {
        let _ = std::fs::create_dir_all(dist);
        let _ = std::fs::write(
            dist.join("index.html"),
            "<!DOCTYPE html><html><body>Launcher Placeholder</body></html>",
        );
        let _ = std::fs::write(
            dist.join("hud.html"),
            "<!DOCTYPE html><html><body>HUD Placeholder</body></html>",
        );
    }
    tauri_build::build();

    #[cfg(windows)]
    {
        if let Ok(out_dir) = std::env::var("OUT_DIR") {
            let lib_res = std::path::Path::new(&out_dir).join("libresource.a");
            if lib_res.exists() {
                println!("cargo:rustc-link-arg={}", lib_res.display());
            }
        }
    }
}
