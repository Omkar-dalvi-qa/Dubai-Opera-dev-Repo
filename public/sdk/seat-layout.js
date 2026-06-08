/**
 * Galaxy Seat Layout Webview SDK (iframe embed)
 *
 * Usage:
 *   <script src="https://your-dashboard-domain/sdk/seat-layout.js"></script>
 *   <div id="seat-map"></div>
 *   <script>
 *     GalaxySeatLayout.mount({
 *       chartId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
 *       container: "#seat-map",
 *       apiBaseUrl: "http://localhost:3001/endpoint/v1",
 *       webviewBaseUrl: "http://localhost:3000",
 *       autosync: true,
 *       onSeatClick: (e) => console.log("seatClick", e),
 *       onSelectionChange: (e) => console.log("selectionChange", e),
 *       onSeatHover: (e) => console.log("seatHover", e),
 *     })
 *   </script>
 */

(function (global) {
  // Hardcoded defaults for POS deployments.
  // You can still override by passing opts.apiBaseUrl / opts.webviewBaseUrl to mount().
  var DEFAULT_API_BASE_URL =
    "https://api-nuvio-events.nuviotech.co/endpoint/v1";
  var DEFAULT_WEBVIEW_BASE_URL = "https://nuvio-events.nuviotech.co";
  // typeof window !== "undefined" && window.location && window.location.origin
  //   ? window.location.origin
  //   : "http://localhost:3000";

  function assert(cond, msg) {
    if (!cond) throw new Error("[GalaxySeatLayout] " + msg);
  }

  function qs(elOrSelector) {
    if (typeof elOrSelector === "string") {
      var el = document.querySelector(elOrSelector);
      assert(el, "container not found: " + elOrSelector);
      return el;
    }
    assert(
      elOrSelector && elOrSelector.nodeType === 1,
      "container must be element or selector",
    );
    return elOrSelector;
  }

  function joinUrl(base, path) {
    if (!base) return path;
    if (base.endsWith("/")) base = base.slice(0, -1);
    if (!path.startsWith("/")) path = "/" + path;
    return base + path;
  }

  async function resolveChart(apiBaseUrl, chartId) {
    var url = joinUrl(
      apiBaseUrl,
      "/dashboard/seat-layout/charts/" +
        encodeURIComponent(chartId) +
        "/resolve",
    );
    var res = await fetch(url, { method: "GET" });
    var json = await res.json();
    if (!res.ok || !json || json.success !== true) {
      throw new Error(
        json && json.message ? json.message : "Could not resolve chartId",
      );
    }
    return json.data;
  }

  function mount(opts) {
    opts = opts || {};
    assert(opts.chartId, "chartId is required");
    var container = qs(opts.container);

    var origin =
      typeof window !== "undefined" && window.location && window.location.origin
        ? window.location.origin
        : "";
    var apiBaseUrl =
      opts.apiBaseUrl ||
      global.GALAXY_SEAT_LAYOUT_API_BASE_URL ||
      DEFAULT_API_BASE_URL;
    var webviewBaseUrl =global.GALAXY_SEAT_LAYOUT_WEBVIEW_BASE_URL;
    var autosync = opts.autosync !== false; // default true

    var destroyed = false;
    var iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Seat map");
    iframe.style.width = "100%";
    iframe.style.height = opts.height || "720px";
    iframe.style.border = "0";
    iframe.style.display = "block";
    iframe.setAttribute("allow", "fullscreen");

    container.innerHTML = "";
    container.appendChild(iframe);

    var unsubscribe = function () {};

    resolveChart(apiBaseUrl, opts.chartId).then(function (info) {
      if (destroyed) return;
      var layoutId = info.layout_id;
      var screenId = info.screen_id;
      var eventId = opts.eventId;

      var src =
        joinUrl(
          DEFAULT_WEBVIEW_BASE_URL,
          "/seat-layout/webview/" + encodeURIComponent(String(layoutId)),
        ) +
        "?embed=1" +
        (autosync ? "&autosync=1" : "") +
        (screenId != null
          ? "&screenId=" + encodeURIComponent(String(screenId))
          : "") +
        (eventId != null
          ? "&eventId=" + encodeURIComponent(String(eventId))
          : "");

      iframe.src = src;

      var handler = function (ev) {
        var data = ev && ev.data;
        if (!data || data.source !== "galaxy-seat-layout-webview") return;
        if (opts.allowedOrigin && ev.origin !== opts.allowedOrigin) return;

        if (data.type === "seatClick" && typeof opts.onSeatClick === "function")
          opts.onSeatClick(data);
        if (
          data.type === "selectionChange" &&
          typeof opts.onSelectionChange === "function"
        )
          opts.onSelectionChange(data);
        if (data.type === "seatHover" && typeof opts.onSeatHover === "function")
          opts.onSeatHover(data);
      };

      window.addEventListener("message", handler);
      unsubscribe = function () {
        window.removeEventListener("message", handler);
      };
    });

    return {
      destroy: function () {
        destroyed = true;
        unsubscribe();
        if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
      },
      iframe: iframe,
    };
  }

  global.GalaxySeatLayout = { mount: mount };
})(typeof window !== "undefined" ? window : this);

/**
 * Galaxy Seat Layout Webview SDK (iframe embed)
 *
 * Usage:
 *   <script src="https://your-dashboard-domain/sdk/seat-layout.js"></script>
 *   <div id="seat-map"></div>
 *   <script>
 *     GalaxySeatLayout.mount({
 *       chartId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
 *       container: "#seat-map",
 *       apiBaseUrl: "http://localhost:3001/endpoint/v1",
 *       webviewBaseUrl: "http://localhost:3000",
 *       autosync: true,
 *       onSeatClick: (e) => console.log("seatClick", e),
 *       onSelectionChange: (e) => console.log("selectionChange", e),
 *       onSeatHover: (e) => console.log("seatHover", e),
 *     })
 *   </script>
 */
