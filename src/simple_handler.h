#ifndef CLIVON_SIMPLE_HANDLER_H_
#define CLIVON_SIMPLE_HANDLER_H_

#include "include/cef_client.h"
#include "include/cef_keyboard_handler.h"
#include "include/cef_resource_request_handler.h" // Required for AdBlock
#include <list>
#include <string>

class SimpleHandler : public CefClient,
                      public CefLifeSpanHandler,
                      public CefRequestHandler,
                      public CefResourceRequestHandler, // Level 4: AdBlock
                      public CefDisplayHandler,
                      public CefLoadHandler, // NEW: For Script Injection
                      public CefKeyboardHandler {
 public:
  SimpleHandler();
  ~SimpleHandler();

  // CefClient methods:
  virtual CefRefPtr<CefLifeSpanHandler> GetLifeSpanHandler() override {
    return this;
  }
  virtual CefRefPtr<CefRequestHandler> GetRequestHandler() override {
    return this;
  }
  virtual CefRefPtr<CefKeyboardHandler> GetKeyboardHandler() override {
    return this;
  }
  virtual CefRefPtr<CefDisplayHandler> GetDisplayHandler() override {
    return this;
  }
  virtual CefRefPtr<CefLoadHandler> GetLoadHandler() override {
    return this; // NEW
  }

  // CefLifeSpanHandler methods:
  virtual void OnAfterCreated(CefRefPtr<CefBrowser> browser) override;
  virtual bool DoClose(CefRefPtr<CefBrowser> browser) override;
  virtual void OnBeforeClose(CefRefPtr<CefBrowser> browser) override;

  // Global Access
  static SimpleHandler* GetInstance();
  
  // AdBlock Control
  static bool is_adblock_enabled_;
  static void ToggleAdBlock();
  static bool IsAdBlockEnabled();
  
  // Returns the first browser (for external control)
  CefRefPtr<CefBrowser> GetBrowser();

  // Returns true if the browser is closing.
  bool IsClosing() const { return is_closing_; }

  // Block new windows (Popups)
  // Using raw logic type to ensure match if typedef is weird
  virtual bool OnBeforePopup(CefRefPtr<CefBrowser> browser,
                             CefRefPtr<CefFrame> frame,
                             int popup_id,
                             const CefString& target_url,
                             const CefString& target_frame_name,
                             cef_window_open_disposition_t target_disposition,
                             bool user_gesture,
                             const CefPopupFeatures& popupFeatures,
                             CefWindowInfo& windowInfo,
                             CefRefPtr<CefClient>& client,
                             CefBrowserSettings& settings,
                             CefRefPtr<CefDictionaryValue>& extra_info,
                             bool* no_javascript_access) override;

  // CefRequestHandler methods:
  // Restrict navigation
  virtual bool OnBeforeBrowse(CefRefPtr<CefBrowser> browser,
                              CefRefPtr<CefFrame> frame,
                              CefRefPtr<CefRequest> request,
                              bool user_gesture,
                              bool is_redirect) override;

  // CefRequestHandler methods:
  virtual CefRefPtr<CefResourceRequestHandler> GetResourceRequestHandler(
      CefRefPtr<CefBrowser> browser,
      CefRefPtr<CefFrame> frame,
      CefRefPtr<CefRequest> request,
      bool is_navigation,
      bool is_download,
      const CefString& request_initiator,
      bool& disable_default_handling) override {
      return this;
  }

  // CefResourceRequestHandler methods (AdBlock):
  virtual ReturnValue OnBeforeResourceLoad(
      CefRefPtr<CefBrowser> browser,
      CefRefPtr<CefFrame> frame,
      CefRefPtr<CefRequest> request,
      CefRefPtr<CefCallback> callback) override;

  // LAYER 4: RESPONSE FILTER (MIME-Type Blocking)
  virtual bool OnResourceResponse(
      CefRefPtr<CefBrowser> browser,
      CefRefPtr<CefFrame> frame,
      CefRefPtr<CefRequest> request,
      CefRefPtr<CefResponse> response) override;

  // CefDisplayHandler methods:
  virtual void OnTitleChange(CefRefPtr<CefBrowser> browser,
                             const CefString& title) override;
  virtual void OnAddressChange(CefRefPtr<CefBrowser> browser,
                               CefRefPtr<CefFrame> frame,
                               const CefString& url) override;

  // CefKeyboardHandler methods:
  virtual bool OnPreKeyEvent(CefRefPtr<CefBrowser> browser,
                             const CefKeyEvent& event,
                             CefEventHandle os_event,
                             bool* is_keyboard_shortcut) override;

  // CefLoadHandler methods:
  virtual void OnLoadStart(CefRefPtr<CefBrowser> browser,
                           CefRefPtr<CefFrame> frame,
                           TransitionType transition_type) override;

 private:
  // List of existing browser windows. Only accessed on the CEF UI thread.
  typedef std::list<CefRefPtr<CefBrowser>> BrowserList;
  BrowserList browser_list_;

  bool is_closing_;

  IMPLEMENT_REFCOUNTING(SimpleHandler);
};

#endif  // CLIVON_SIMPLE_HANDLER_H_
