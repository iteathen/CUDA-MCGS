cmake_minimum_required(VERSION 3.28)

if(NOT DEFINED CMAKE_CUDA_ARCHITECTURES)
  set(CMAKE_CUDA_ARCHITECTURES native)
endif()

project(cuda_device_mcgs_prototype LANGUAGES CXX CUDA)

add_executable(cuda_device_mcgs src/main.cu)
target_compile_features(cuda_device_mcgs PRIVATE cxx_std_17 cuda_std_17)

set_target_properties(
  cuda_device_mcgs
  PROPERTIES
    CUDA_SEPARABLE_COMPILATION OFF
    CUDA_RESOLVE_DEVICE_SYMBOLS OFF
)

target_compile_options(
  cuda_device_mcgs
  PRIVATE
    $<$<COMPILE_LANGUAGE:CUDA>:--generate-line-info>
    $<$<AND:$<COMPILE_LANGUAGE:CUDA>,$<CXX_COMPILER_ID:MSVC>>:-Xcompiler=/W4>
    $<$<AND:$<COMPILE_LANGUAGE:CUDA>,$<CXX_COMPILER_ID:MSVC>>:-Xcompiler=/Zc:preprocessor>
)
