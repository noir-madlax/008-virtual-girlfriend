#!/bin/bash

# 关闭代理
unset ALL_PROXY
unset HTTPS_PROXY
unset HTTP_PROXY

# 清除git代理配置
git config --unset http.proxy
git config --unset https.proxy

# 推送代码
git push origin main