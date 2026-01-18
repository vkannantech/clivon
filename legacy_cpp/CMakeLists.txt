cmake_minimum_required(VERSION 3.19)

project(clivon)

# Set the C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Define the CEF root directory
set(CEF_ROOT "${CMAKE_SOURCE_DIR}/third_party/cef")
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CEF_ROOT}/cmake")

# Find the CEF package
find_package(CEF REQUIRED)

# Include the CEF header files
include_directories(${CEF_ROOT})
include_directories(${CEF_ROOT}/include)
include_directories(${CMAKE_SOURCE_DIR})

# Build libcef_dll_wrapper
add_subdirectory(${CEF_ROOT} libcef_dll_wrapper)

# Define the source files
set(SOURCE_FILES
    src/main.cc
    src/simple_app.cc
    src/simple_handler.cc
    src/host_window.cc
    src/ghost_bar.cc
)

# Add the executable
add_executable(clivon WIN32 ${SOURCE_FILES})

# Link the CEF library
target_link_libraries(clivon 
    libcef_dll_wrapper 
    ${CEF_ROOT}/Release/libcef.lib 
    kernel32.lib
    user32.lib
    gdi32.lib
    winspool.lib
    shell32.lib
    ole32.lib
    oleaut32.lib
    uuid.lib
    comdlg32.lib
    advapi32.lib
    comctl32.lib
    shlwapi.lib
    rpcrt4.lib
    shcore.lib
    ws2_32.lib
    dbghelp.lib
    psapi.lib
    version.lib
    winmm.lib
)

# Add the manifest file for Windows
if(WIN32)
    set_property(TARGET clivon PROPERTY MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")

    # Custom post-build step to# DISABLE AUTO-COPY TO PREVENT FILE LOCKS
# Resources must be copied manually or via a separate script.
# add_custom_command(
#   TARGET ${PROJECT_NAME} POST_BUILD
#   COMMAND ${CMAKE_COMMAND} -E copy_if_different
#   ${CEF_BINARY_DIR}/Release/libcef.dll $<TARGET_FILE_DIR:${PROJECT_NAME}>
#   COMMAND ${CMAKE_COMMAND} -E copy_if_different
#   ${CEF_BINARY_DIR}/Release/icudtl.dat $<TARGET_FILE_DIR:${PROJECT_NAME}>
#   COMMAND ${CMAKE_COMMAND} -E copy_if_different
#   ${CEF_BINARY_DIR}/Release/chrome_elf.dll $<TARGET_FILE_DIR:${PROJECT_NAME}>
#   COMMAND ${CMAKE_COMMAND} -E copy_if_different
#   ${CEF_BINARY_DIR}/Release/v8_context_snapshot.bin $<TARGET_FILE_DIR:${PROJECT_NAME}>
#   COMMAND ${CMAKE_COMMAND} -E copy_directory
#   ${CEF_BINARY_DIR}/Resources $<TARGET_FILE_DIR:${PROJECT_NAME}>
# )
endif()
