#ifndef CLIVON_SIMPLE_APP_H_
#define CLIVON_SIMPLE_APP_H_

#include "include/cef_app.h"

class SimpleApp : public CefApp, public CefBrowserProcessHandler {
 public:
  SimpleApp();

  // CefApp methods:
  virtual CefRefPtr<CefBrowserProcessHandler> GetBrowserProcessHandler() override {
    return this;
  }

  virtual void OnBeforeCommandLineProcessing(
      const CefString& process_type,
      CefRefPtr<CefCommandLine> command_line) override;

  // CefBrowserProcessHandler methods:
  virtual void OnContextInitialized() override;

  // EXPLICIT PARENTING: Pass the Host Window handle safely
  void SetHostWindow(HWND hwnd) { host_window_ = hwnd; }

 private:
  HWND host_window_ = NULL;
  
  // Include the default reference counting implementation.
  IMPLEMENT_REFCOUNTING(SimpleApp);
};

#endif  // CLIVON_SIMPLE_APP_H_
