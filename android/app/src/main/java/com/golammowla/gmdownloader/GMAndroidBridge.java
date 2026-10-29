package com.golammowla.gmdownloader;

import android.app.DownloadManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.yausername.youtubedl_android.YoutubeDL;
import com.yausername.youtubedl_android.YoutubeDLRequest;
import com.yausername.youtubedl_android.YoutubeDLResponse;

import org.json.JSONObject;
import java.io.File;
import kotlin.Unit;

public class GMAndroidBridge {
    private final MainActivity activity;
    private final Handler mainHandler;
    private volatile String pendingSharedUrl = null;

    public GMAndroidBridge(MainActivity activity) {
        this.activity = activity;
        this.mainHandler = new Handler(Looper.getMainLooper());
    }

    @JavascriptInterface
    public boolean isAndroidAvailable() {
        return true;
    }

    @JavascriptInterface
    public String getPendingSharedUrl() {
        String url = this.pendingSharedUrl;
        this.pendingSharedUrl = null;
        return url;
    }

    public void setPendingSharedUrl(String url) {
        this.pendingSharedUrl = url;
    }

    public void dispatchSharedUrl(String url) {
        if (url == null || url.isEmpty()) return;
        this.pendingSharedUrl = url;
        evalJs("if (window.onAndroidSharedUrl) { window.onAndroidSharedUrl(" + JSONObject.quote(url) + "); }");
    }

    @JavascriptInterface
    public String getDownloadPath() {
        File downloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        File appDir = new File(downloads, "GM-Downloader");
        if (!appDir.exists()) {
            appDir.mkdirs();
        }
        return appDir.getAbsolutePath();
    }

    @JavascriptInterface
    public void chooseFolder() {
        activity.runOnUiThread(() -> {
            activity.openFolderPicker();
        });
    }

    public void dispatchSelectedFolder(String folderPath) {
        if (folderPath == null || folderPath.isEmpty()) return;
        evalJs("if (window.onAndroidFolderSelected) { window.onAndroidFolderSelected(" + JSONObject.quote(folderPath) + "); }");
    }

    @JavascriptInterface
    public void openFolder(String folderPath) {
        activity.runOnUiThread(() -> {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW);
                Uri uri = Uri.parse("content://com.android.externalstorage.documents/document/primary%3ADownload");
                intent.setDataAndType(uri, "vnd.android.document/directory");
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(intent);
            } catch (Exception e) {
                try {
                    Intent fallback = new Intent(DownloadManager.ACTION_VIEW_DOWNLOADS);
                    fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    activity.startActivity(fallback);
                } catch (Exception ex) {
                    Log.e("GMDownloader", "Failed to open folder", ex);
                }
            }
        });
    }

    @JavascriptInterface
    public void fetchMediaInfo(String url, String callbackId) {
        new Thread(() -> {
            try {
                YoutubeDLRequest request = new YoutubeDLRequest(url);
                request.addOption("--dump-single-json");
                request.addOption("--no-playlist");
                request.addOption("--no-check-certificates");
                request.addOption("--no-update");
                request.addOption("--compat-options", "manifest-filesize-approx");
                YoutubeDLResponse response = YoutubeDL.getInstance().execute(request);
                String json = response.getOut();
                if (json != null) {
                    int start = json.indexOf('{');
                    int end = json.lastIndexOf('}');
                    if (start >= 0 && end > start) {
                        json = json.substring(start, end + 1);
                    }
                }
                evalJs("window.onAndroidFetchSuccess(" + JSONObject.quote(callbackId) + ", " + json + ");");
            } catch (Exception e) {
                Log.e("GMDownloader", "fetchMediaInfo error", e);
                // Fallback attempt: if default failed, retry with ios,web
                try {
                    YoutubeDLRequest fallback = new YoutubeDLRequest(url);
                    fallback.addOption("--dump-single-json");
                    fallback.addOption("--no-playlist");
                    fallback.addOption("--no-check-certificates");
                    fallback.addOption("--no-update");
                    fallback.addOption("--extractor-args", "youtube:player_client=ios,web");
                    fallback.addOption("--compat-options", "manifest-filesize-approx");
                    YoutubeDLResponse fallbackResp = YoutubeDL.getInstance().execute(fallback);
                    String json = fallbackResp.getOut();
                    if (json != null) {
                        int start = json.indexOf('{');
                        int end = json.lastIndexOf('}');
                        if (start >= 0 && end > start) {
                            json = json.substring(start, end + 1);
                        }
                    }
                    evalJs("window.onAndroidFetchSuccess(" + JSONObject.quote(callbackId) + ", " + json + ");");
                    return;
                } catch (Exception ex2) {
                    Log.e("GMDownloader", "fetchMediaInfo fallback error", ex2);
                }
                evalJs("window.onAndroidFetchError(" + JSONObject.quote(callbackId) + ", " + JSONObject.quote(e.getMessage() != null ? e.getMessage() : e.toString()) + ");");
            }
        }).start();
    }

    // Overload for 9 arguments (backwards compatibility)
    @JavascriptInterface
    public void startDownload(String taskId, String url, String formatSpec, String container, boolean enableClip, String startTime, String endTime, boolean enableSubs, String subLangs) {
        startDownload(taskId, url, formatSpec, container, enableClip, startTime, endTime, enableSubs, subLangs, null, null);
    }

    // Overload for 10 arguments (backwards compatibility)
    @JavascriptInterface
    public void startDownload(String taskId, String url, String formatSpec, String container, boolean enableClip, String startTime, String endTime, boolean enableSubs, String subLangs, String customSaveFolder) {
        startDownload(taskId, url, formatSpec, container, enableClip, startTime, endTime, enableSubs, subLangs, customSaveFolder, null);
    }

    @JavascriptInterface
    public void startDownload(String taskId, String url, String formatSpec, String container, boolean enableClip, String startTime, String endTime, boolean enableSubs, String subLangs, String customSaveFolder, String customFilename) {
        new Thread(() -> {
            try {
                File saveDir;
                if (customSaveFolder != null && !customSaveFolder.trim().isEmpty()) {
                    saveDir = new File(customSaveFolder.trim());
                } else {
                    saveDir = new File(getDownloadPath());
                }
                if (!saveDir.exists()) {
                    saveDir.mkdirs();
                }

                // Clean container & audio extraction handling
                String cUpper = container != null ? container.toUpperCase() : "";
                String targetExt = null;
                boolean isAudio = cUpper.contains("AUDIO");

                if (cUpper.startsWith("MP4")) targetExt = "mp4";
                else if (cUpper.startsWith("WEBM")) targetExt = "webm";
                else if (cUpper.startsWith("MKV")) targetExt = "mkv";
                else if (cUpper.startsWith("MOV")) targetExt = "mov";
                else if (cUpper.startsWith("AVI")) targetExt = "avi";
                else if (cUpper.startsWith("MP3")) targetExt = "mp3";
                else if (cUpper.startsWith("M4A")) targetExt = "m4a";
                else if (cUpper.startsWith("OPUS")) targetExt = "opus";
                else if (cUpper.startsWith("FLAC")) targetExt = "flac";
                else if (cUpper.startsWith("WAV")) targetExt = "wav";
                else if (cUpper.startsWith("OGG")) targetExt = "ogg";

                YoutubeDLRequest request = new YoutubeDLRequest(url);
                String filenameTmpl = "%(title)s.%(ext)s";
                if (customFilename != null && !customFilename.trim().isEmpty()) {
                    String sanitized = customFilename.trim().replaceAll("[\\\\/:*?\"<>|]", "_");
                    filenameTmpl = sanitized + ".%(ext)s";
                }
                request.addOption("-o", saveDir.getAbsolutePath() + "/" + filenameTmpl);
                request.addOption("--no-part");
                request.addOption("--no-check-certificates");
                request.addOption("--no-update");
                request.addOption("--compat-options", "manifest-filesize-approx");

                if (formatSpec != null && !formatSpec.isEmpty() && !formatSpec.equals("best")) {
                    request.addOption("-f", formatSpec + "/bestvideo+bestaudio/best");
                } else {
                    request.addOption("-f", "bestvideo+bestaudio/best");
                }

                if (targetExt != null) {
                    if (isAudio) {
                        request.addOption("-x");
                        request.addOption("--audio-format", targetExt);
                    } else {
                        request.addOption("--merge-output-format", targetExt);
                    }
                }

                if (enableClip && startTime != null && endTime != null && !startTime.isEmpty()) {
                    request.addOption("--download-sections", "*" + startTime + "-" + endTime);
                }
                if (enableSubs) {
                    request.addOption("--write-subs");
                    if (subLangs != null && !subLangs.isEmpty()) {
                        request.addOption("--sub-langs", subLangs);
                    }
                }

                evalJs("window.onAndroidLog(" + JSONObject.quote("[Android yt-dlp] Starting download for task " + taskId + " into " + saveDir.getAbsolutePath()) + ");");

                try {
                    YoutubeDL.getInstance().execute(request, taskId, (progress, eta, line) -> {
                        evalJs("window.onAndroidProgress(" + JSONObject.quote(taskId) + ", " + progress + ", " + eta + ", " + JSONObject.quote(line) + ");");
                        evalJs("window.onAndroidLog(" + JSONObject.quote(line) + ");");
                        return Unit.INSTANCE;
                    });
                } catch (Exception execErr) {
                    String execMsg = execErr.getMessage() != null ? execErr.getMessage() : "";
                    if (execMsg.contains("403") || execMsg.contains("SABR") || execMsg.contains("Forbidden")) {
                        evalJs("window.onAndroidLog(" + JSONObject.quote("[Android yt-dlp] 403 / SABR stream restriction detected. Switching to Android Native Direct Stream fallback...") + ");");

                        YoutubeDLRequest fallbackReq = new YoutubeDLRequest(url);
                        fallbackReq.addOption("-o", saveDir.getAbsolutePath() + "/%(title)s.%(ext)s");
                        fallbackReq.addOption("--no-part");
                        fallbackReq.addOption("--no-check-certificates");
                        fallbackReq.addOption("--no-update");
                        fallbackReq.addOption("--extractor-args", "youtube:player_client=android");
                        fallbackReq.addOption("-f", "bestvideo[protocol^=http]+bestaudio[protocol^=http]/best[protocol^=http]/best");

                        if (targetExt != null) {
                            if (isAudio) {
                                fallbackReq.addOption("-x");
                                fallbackReq.addOption("--audio-format", targetExt);
                            } else {
                                fallbackReq.addOption("--merge-output-format", targetExt);
                            }
                        }
                        if (enableClip && startTime != null && endTime != null && !startTime.isEmpty()) {
                            fallbackReq.addOption("--download-sections", "*" + startTime + "-" + endTime);
                        }

                        YoutubeDL.getInstance().execute(fallbackReq, taskId, (progress, eta, line) -> {
                            evalJs("window.onAndroidProgress(" + JSONObject.quote(taskId) + ", " + progress + ", " + eta + ", " + JSONObject.quote(line) + ");");
                            evalJs("window.onAndroidLog(" + JSONObject.quote(line) + ");");
                            return Unit.INSTANCE;
                        });
                    } else {
                        throw execErr;
                    }
                }

                evalJs("window.onAndroidComplete(" + JSONObject.quote(taskId) + ", true, null);");
            } catch (Exception e) {
                Log.e("GMDownloader", "startDownload error", e);
                evalJs("window.onAndroidComplete(" + JSONObject.quote(taskId) + ", false, " + JSONObject.quote(e.getMessage() != null ? e.getMessage() : e.toString()) + ");");
            }
        }).start();
    }

    @JavascriptInterface
    public void cancelDownload(String taskId) {
        new Thread(() -> {
            try {
                YoutubeDL.getInstance().destroyProcessById(taskId);
                evalJs("window.onAndroidLog(" + JSONObject.quote("[Android yt-dlp] Cancelled task " + taskId) + ");");
            } catch (Exception e) {
                Log.e("GMDownloader", "cancelDownload error", e);
            }
        }).start();
    }

    @JavascriptInterface
    public void updateYtDlp(String callbackId) {
        new Thread(() -> {
            try {
                evalJs("window.onAndroidLog(\"[Updater] Checking and downloading latest yt-dlp binary from GitHub...\");");
                YoutubeDL.UpdateStatus status = YoutubeDL.getInstance().updateYoutubeDL(activity.getApplicationContext(), YoutubeDL.UpdateChannel.STABLE.INSTANCE);
                evalJs("window.onAndroidLog(\"[Updater] ✔ yt-dlp update status: " + status.name() + "\");");
                evalJs("window.onAndroidUpdateResult(" + JSONObject.quote(callbackId) + ", true, \"yt-dlp updated successfully! Status: " + status.name() + "\");");
            } catch (Exception e) {
                Log.e("GMDownloader", "updateYtDlp error", e);
                evalJs("window.onAndroidLog(\"[Updater] ❌ Error updating yt-dlp: " + JSONObject.quote(e.getMessage() != null ? e.getMessage() : e.toString()) + "\");");
                evalJs("window.onAndroidUpdateResult(" + JSONObject.quote(callbackId) + ", false, \"Error: " + (e.getMessage() != null ? e.getMessage() : e.toString()) + "\");");
            }
        }).start();
    }

    public void evalJs(String code) {
        mainHandler.post(() -> {
            WebView wv = activity.getBridge() != null ? activity.getBridge().getWebView() : null;
            if (wv != null) {
                wv.evaluateJavascript(code, null);
            }
        });
    }
}
