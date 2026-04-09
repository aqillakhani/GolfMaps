# Add project specific ProGuard rules here.
# https://developer.android.com/guide/developing/tools/proguard

# Preserve line numbers so crash stack traces from the Play Console are
# useful even after R8 minification.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ---------- Capacitor runtime ------------------------------------------------
# Capacitor reflects into plugin classes at runtime via @CapacitorPlugin and
# @PluginMethod annotations. R8 will strip them unless we explicitly keep them.
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.annotation.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class ** {
    @com.getcapacitor.PluginMethod public *;
}

# Official Capacitor plugins bundled with this app (camera, splash, etc.).
-keep class com.capacitorjs.plugins.** { *; }

# WebView's JavaScript bridge classes must stay intact so the web code can
# continue to talk to native plugins after minification.
-keepclassmembers class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Cordova compatibility plugins loaded through the Capacitor bridge.
-keep class org.apache.cordova.** { *; }

# ---------- Misc -------------------------------------------------------------
# Silence warnings from optional TLS providers we don't ship.
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
