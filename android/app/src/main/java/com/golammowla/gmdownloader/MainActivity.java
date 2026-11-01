package com.golammowla.gmdownloader;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.yausername.youtubedl_android.YoutubeDL;
import com.yausername.ffmpeg.FFmpeg;
import java.io.File;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MainActivity extends BridgeActivity {
    public static final int REQUEST_CODE_PICK_FOLDER = 8888;
    private GMAndroidBridge bridge;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        try {
            YoutubeDL.getInstance().init(this.getApplicationContext());
            FFmpeg.getInstance().init(this.getApplicationContext());
            Log.d("GMDownloader", "Native yt-dlp & FFmpeg initialized successfully!");

            // Background auto-update check for yt-dlp on startup
            new Thread(() -> {
                try {
                    YoutubeDL.getInstance().updateYoutubeDL(getApplicationContext(), YoutubeDL.UpdateChannel.STABLE.INSTANCE);
                    Log.d("GMDownloader", "Background yt-dlp binary check/update completed.");
                } catch (Exception e) {
                    Log.w("GMDownloader", "Background yt-dlp update check skipped: " + e.getMessage());
                }
            }).start();
        } catch (Exception e) {
            Log.e("GMDownloader", "Failed to initialize YoutubeDL / FFmpeg", e);
        }

        bridge = new GMAndroidBridge(this);
        if (this.getBridge() != null && this.getBridge().getWebView() != null) {
            this.getBridge().getWebView().addJavascriptInterface(bridge, "GMAndroidBridge");
        }

        handleIntent(getIntent());
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    @Override
    public void onResume() {
        super.onResume();
        if (bridge == null) {
            bridge = new GMAndroidBridge(this);
        }
        if (this.getBridge() != null && this.getBridge().getWebView() != null) {
            this.getBridge().getWebView().addJavascriptInterface(bridge, "GMAndroidBridge");
        }
    }

    public void openFolderPicker() {
        try {
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION 
                          | Intent.FLAG_GRANT_WRITE_URI_PERMISSION 
                          | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
            startActivityForResult(intent, REQUEST_CODE_PICK_FOLDER);
        } catch (Exception e) {
            Log.e("GMDownloader", "Could not launch folder picker", e);
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_CODE_PICK_FOLDER && resultCode == RESULT_OK && data != null) {
            Uri treeUri = data.getData();
            if (treeUri != null) {
                try {
                    getContentResolver().takePersistableUriPermission(
                        treeUri,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                    );
                } catch (Exception ignored) {}

                String resolvedPath = getPathFromTreeUri(treeUri);
                if (resolvedPath != null && bridge != null) {
                    bridge.dispatchSelectedFolder(resolvedPath);
                }
            }
        }
    }

    private String getPathFromTreeUri(Uri treeUri) {
        if (treeUri == null) return null;
        String path = treeUri.getPath();
        if (path == null) return null;

        // Formats: /tree/primary:Download or /document/primary:Download/MyFolder
        if (path.contains("primary:")) {
            String sub = path.substring(path.indexOf("primary:") + 8);
            File f = new File(Environment.getExternalStorageDirectory(), sub);
            return f.getAbsolutePath();
        } else if (path.contains(":")) {
            int colon = path.indexOf(':');
            String sub = path.substring(colon + 1);
            String id = path.substring(path.lastIndexOf('/', colon) + 1, colon);
            File f = new File("/storage/" + id, sub);
            if (f.exists()) {
                return f.getAbsolutePath();
            }
            return new File(Environment.getExternalStorageDirectory(), sub).getAbsolutePath();
        }
        File downloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        return new File(downloads, "GM-Downloader").getAbsolutePath();
    }

    private void handleIntent(Intent intent) {
        if (intent == null) return;
        String sharedUrl = extractUrlFromIntent(intent);
        if (sharedUrl != null && !sharedUrl.isEmpty()) {
            Log.d("GMDownloader", "Received shared URL from Intent: " + sharedUrl);
            if (bridge != null) {
                bridge.dispatchSharedUrl(sharedUrl);
            }
        }
    }

    private String extractUrlFromIntent(Intent intent) {
        if (intent == null) return null;
        String action = intent.getAction();

        // 1. Direct Data URI (VIEW intents: magnet, gdm, gmdownloader, http, https, content, file)
        Uri dataUri = intent.getData();
        if (dataUri != null) {
            String dataStr = intent.getDataString();
            if (dataStr != null && !dataStr.isEmpty()) {
                String trimmed = dataStr.trim();
                if (trimmed.startsWith("gdm://")) {
                    trimmed = trimmed.substring(6);
                    if (trimmed.startsWith("open?url=")) {
                        try {
                            String query = dataUri.getQueryParameter("url");
                            if (query != null && !query.isEmpty()) return query;
                        } catch (Exception ignored) {}
                    }
                } else if (trimmed.startsWith("gmdownloader://")) {
                    trimmed = trimmed.substring(15);
                    if (trimmed.startsWith("open?url=")) {
                        try {
                            String query = dataUri.getQueryParameter("url");
                            if (query != null && !query.isEmpty()) return query;
                        } catch (Exception ignored) {}
                    }
                }

                if (trimmed.startsWith("magnet:") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
                    return trimmed;
                }
                if (trimmed.startsWith("content://") || trimmed.startsWith("file://")) {
                    return trimmed;
                }
            }
        }

        // 2. Extras (SEND intents: sharing from browser or other apps)
        if (Intent.ACTION_SEND.equals(action)) {
            String text = intent.getStringExtra(Intent.EXTRA_TEXT);
            if (text != null && !text.trim().isEmpty()) {
                String cleanText = text.trim();
                if (cleanText.startsWith("magnet:")) {
                    return cleanText;
                }
                Matcher m = Pattern.compile("https?://[^\\s]+").matcher(cleanText);
                if (m.find()) {
                    return m.group();
                }
                return cleanText;
            }

            // Stream extra for file sharing
            try {
                Uri streamUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
                if (streamUri != null) {
                    return streamUri.toString();
                }
            } catch (Exception ignored) {}
        }

        return null;
    }
}
