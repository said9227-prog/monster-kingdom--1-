package com.example.ui

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.view.ViewGroup
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView

private const val ASSET_ORIGIN = "https://appassets.androidplatform.net"

private class LocalAssetsWebViewClient(
  private val context: Context,
  private val onAssetError: (String) -> Unit,
) : WebViewClient() {
  override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest): WebResourceResponse? {
    val url = request.url
    if (url.host != "appassets.androidplatform.net") return null
    val rawPath = url.path ?: return null
    val assetPath = rawPath.removePrefix("/assets/").removePrefix("/")
    return try {
      val stream = context.assets.open(assetPath)
      val mime = guessMimeType(assetPath)
      WebResourceResponse(mime, "UTF-8", stream).apply {
        responseHeaders = mapOf(
          "Access-Control-Allow-Origin" to "*",
          "Cache-Control" to "no-cache",
        )
      }
    } catch (_: Exception) {
      null
    }
  }

  override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
    if (request?.isForMainFrame == true) {
      onAssetError(error?.description?.toString() ?: "WebView load error")
    }
  }

  private fun guessMimeType(path: String): String = when {
    path.endsWith(".html", ignoreCase = true) -> "text/html"
    path.endsWith(".js", ignoreCase = true) || path.endsWith(".mjs", ignoreCase = true) -> "application/javascript"
    path.endsWith(".css", ignoreCase = true) -> "text/css"
    path.endsWith(".wasm", ignoreCase = true) -> "application/wasm"
    path.endsWith(".glb", ignoreCase = true) -> "model/gltf-binary"
    path.endsWith(".gltf", ignoreCase = true) -> "model/gltf+json"
    path.endsWith(".json", ignoreCase = true) -> "application/json"
    path.endsWith(".png", ignoreCase = true) -> "image/png"
    path.endsWith(".jpg", ignoreCase = true) -> "image/jpeg"
    else -> "application/octet-stream"
  }
}

private class JsAndroidBridge(
  private val onTelemetryCallback: (String) -> Unit,
  private val onEventCallback: (String) -> Unit,
) {
  @JavascriptInterface
  fun onTelemetry(json: String) {
    onTelemetryCallback(json)
  }

  @JavascriptInterface
  fun onGameEvent(json: String) {
    onEventCallback(json)
  }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun GameWebView(
  viewModel: GameViewModel,
  modifier: Modifier = Modifier,
) {
  val context = LocalContext.current
  val webView = remember {
    WebView(context).apply {
      layoutParams = ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
      )
      setBackgroundColor(Color.parseColor("#120D0A"))
      settings.apply {
        javaScriptEnabled = true
        domStorageEnabled = true
        allowFileAccess = false
        allowContentAccess = false
        mediaPlaybackRequiresUserGesture = false
        cacheMode = WebSettings.LOAD_DEFAULT
      }
      webChromeClient = object : WebChromeClient() {
        override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
          if (consoleMessage.messageLevel() == ConsoleMessage.MessageLevel.ERROR) {
            val msg = consoleMessage.message().replace("\"", "'")
            post { viewModel.onGameEventJson("""{"type":"ERROR","data":{"message":"$msg"}}""") }
          }
          return true
        }
      }
      webViewClient = LocalAssetsWebViewClient(context) { err ->
        val safe = err.replace("\"", "'")
        post { viewModel.onGameEventJson("""{"type":"ERROR","data":{"message":"$safe"}}""") }
      }
      addJavascriptInterface(
        JsAndroidBridge(
          onTelemetryCallback = { json -> post { viewModel.onTelemetryJson(json) } },
          onEventCallback = { json -> post { viewModel.onGameEventJson(json) } },
        ),
        "AndroidBridge",
      )
      loadUrl("$ASSET_ORIGIN/assets/index.html")
    }
  }

  DisposableEffect(webView) {
    viewModel.attachCommandSink { cmd, payloadJson ->
      val safeCmd = cmd.replace("'", "\\'")
      val safePayload = payloadJson.replace("\\", "\\\\").replace("'", "\\'")
      webView.post {
        webView.evaluateJavascript("window.GameAPI?.command('$safeCmd', '$safePayload');", null)
      }
    }
    onDispose {
      webView.destroy()
    }
  }

  AndroidView(
    factory = { webView },
    modifier = modifier,
  )
}
