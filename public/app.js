// 生成热力图
async function generateHeatmap() {
    const username = document.getElementById('usernameInput').value.trim();
    const colorScheme = document.getElementById('colorScheme').value;

    if (!username) {
        showError('请输入 GitHub 用户名');
        return;
    }

    // 验证用户名格式
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(username)) {
        showError('用户名格式不正确（只能包含字母、数字和连字符）');
        return;
    }

    // 显示加载状态
    showLoading(true);
    hideError();
    hideResult();

    try {
        // 获取贡献数据
        const response = await fetch(`/api/contributions/${username}`);
        
        // 检查 HTTP 状态码
        if (response.status === 404) {
            throw new Error('用户不存在，请检查用户名是否正确');
        }
        
        if (response.status === 429) {
            throw new Error('请求过于频繁，请稍后再试');
        }
        
        if (!response.ok) {
            throw new Error(`服务器错误 (${response.status})`);
        }
        
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || '获取数据失败');
        }

        const data = result.data;

        // 显示用户信息
        displayUserInfo(data.userProfile, data.totalContributions);

        // 生成并显示热力图（带错误处理）
        await generateAndDisplayImages(username, colorScheme);

        // 显示项目列表
        displayProjects(data.projectStats);

        // 显示结果
        showResult();
    } catch (error) {
        console.error('Error:', error);
        
        // 友好的错误提示
        let errorMessage = '发生未知错误';
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = '网络连接失败，请检查网络连接';
        } else if (error.message.includes('用户不存在')) {
            errorMessage = error.message;
        } else if (error.message.includes('请求过于频繁')) {
            errorMessage = error.message;
        } else if (error.message.includes('服务器错误')) {
            errorMessage = '服务器暂时不可用，请稍后重试';
        } else {
            errorMessage = error.message || '获取数据失败，请稍后重试';
        }
        
        showError(errorMessage);
    } finally {
        showLoading(false);
    }
}

// 显示用户信息
function displayUserInfo(profile, totalContributions) {
    document.getElementById('avatar').src = profile.avatar_url;
    document.getElementById('userName').textContent = profile.name || profile.login;
    document.getElementById('userBio').textContent = profile.bio || 'No bio available';
    document.getElementById('totalContributions').textContent = 
        `总贡献数: ${totalContributions.toLocaleString()}`;
}

// 生成并显示图片
async function generateAndDisplayImages(username, colorScheme) {
    try {
        // 生成热力图
        const heatmapUrl = `/api/heatmap/${username}?colorScheme=${colorScheme}`;
        await loadImage('heatmapImage', heatmapUrl);

        // 生成语言分布图
        const languageUrl = `/api/languages/${username}`;
        await loadImage('languageImage', languageUrl);

        // 生成分享卡片
        const shareCardUrl = `/api/share-card/${username}?colorScheme=${colorScheme}`;
        await loadImage('shareCardImage', shareCardUrl);
    } catch (error) {
        console.error('Image generation error:', error);
        throw new Error('图片生成失败，请稍后重试');
    }
}

// 加载图片（带错误处理）
function loadImage(elementId, src) {
    return new Promise((resolve, reject) => {
        const img = document.getElementById(elementId);
        
        img.onload = () => resolve();
        img.onerror = () => {
            reject(new Error(`Failed to load image: ${src}`));
        };
        
        img.src = src;
    });
}

// 显示项目列表
function displayProjects(projects) {
    const projectsList = document.getElementById('projectsList');
    projectsList.innerHTML = '';

    if (!projects || projects.length === 0) {
        projectsList.innerHTML = '<p style="color: #586069;">暂无项目数据</p>';
        return;
    }

    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        
        card.innerHTML = `
            <div class="project-name">${escapeHtml(project.name)}</div>
            <div class="project-description">${escapeHtml(project.description)}</div>
            <div class="project-stats">
                <span>⭐ ${project.stars}</span>
                <span>🍴 ${project.forks}</span>
                <span>💻 ${project.primaryLanguage}</span>
            </div>
        `;
        
        projectsList.appendChild(card);
    });
}

// 下载图片
function downloadImage(imageId, filename) {
    const image = document.getElementById(imageId);
    const link = document.createElement('a');
    link.href = image.src;
    link.download = filename;
    link.click();
}

// 显示/隐藏加载状态
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

// 显示错误
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // 5秒后自动隐藏
    setTimeout(() => {
        hideError();
    }, 5000);
}

// 隐藏错误
function hideError() {
    document.getElementById('error').style.display = 'none';
}

// 显示结果
function showResult() {
    document.getElementById('result').style.display = 'block';
}

// 隐藏结果
function hideResult() {
    document.getElementById('result').style.display = 'none';
}

// HTML转义，防止XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 回车键触发生成
document.getElementById('usernameInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        generateHeatmap();
    }
});

// 页面加载完成后聚焦输入框
window.addEventListener('load', function() {
    document.getElementById('usernameInput').focus();
});

// 全局错误捕获
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showError('发生未知错误，请刷新页面重试');
});
