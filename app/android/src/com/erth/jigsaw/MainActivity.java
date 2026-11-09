package com.erth.jigsaw;
import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.graphics.Insets;
import android.view.WindowInsets;
import android.widget.FrameLayout;
import android.webkit.*;
import android.net.Uri;
import android.content.Intent;
import java.io.*;
public class MainActivity extends Activity {
 private WebView web;
 @Override public void onCreate(Bundle state){super.onCreate(state);getWindow().setStatusBarColor(0xff07171e);getWindow().setNavigationBarColor(0xff07171e);
 if(Build.VERSION.SDK_INT>=30)getWindow().setDecorFitsSystemWindows(false);
 FrameLayout root=new FrameLayout(this);root.setBackgroundColor(0xff07171e);
 web=new WebView(this);web.setBackgroundColor(0xff07171e);
 root.addView(web,new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT,FrameLayout.LayoutParams.MATCH_PARENT));setContentView(root);
 // Resize the actual WebView viewport; WebView padding does not protect fixed web controls.
 root.setOnApplyWindowInsetsListener((v,insets)->{
  if(Build.VERSION.SDK_INT>=30){Insets bars=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout()|WindowInsets.Type.ime());v.setPadding(bars.left,bars.top,bars.right,bars.bottom);return WindowInsets.CONSUMED;}
  v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets.consumeSystemWindowInsets();
 });root.requestApplyInsets();
 WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(false);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setSupportMultipleWindows(false);web.setWebChromeClient(new WebChromeClient(){@Override public boolean onJsConfirm(WebView v,String url,String message,JsResult result){new android.app.AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton(android.R.string.ok,(d,w)->result.confirm()).setNegativeButton(android.R.string.cancel,(d,w)->result.cancel()).setOnCancelListener(d->result.cancel()).show();return true;}});web.setWebViewClient(new WebViewClient(){
 @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest req){Uri u=req.getUrl();if(!"https".equals(u.getScheme())||!"appassets.androidplatform.net".equals(u.getHost()))return denied();String path=u.getPath();if(path==null||path.contains(".."))return denied();if(path.equals("/"))path="/index.html";String ext=path.substring(path.lastIndexOf('.')+1);String mime=ext.equals("js")?"application/javascript":ext.equals("json")||ext.equals("geojson")?"application/json":ext.equals("css")?"text/css":ext.equals("html")?"text/html":ext.equals("webp")?"image/webp":ext.equals("jpg")||ext.equals("jpeg")?"image/jpeg":ext.equals("png")?"image/png":ext.equals("svg")?"image/svg+xml":"text/plain";try{return new WebResourceResponse(mime,mime.startsWith("image/")?null:"UTF-8",getAssets().open("web"+path));}catch(IOException ex){return denied();}}
 private WebResourceResponse denied(){return new WebResourceResponse("text/plain","UTF-8",404,"Not found",java.util.Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
 @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){Uri u=r.getUrl();if("appassets.androidplatform.net".equals(u.getHost()))return false;if("https".equals(u.getScheme()))try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception ignored){}return true;}
 });web.loadUrl("https://appassets.androidplatform.net/index.html");}
 @Override public void onBackPressed(){web.evaluateJavascript("window.erthBack?window.erthBack():false",value->{if(!"true".equals(value))finish();});}
 @Override protected void onPause(){super.onPause();web.onPause();}
 @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
}
