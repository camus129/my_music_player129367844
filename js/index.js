// 定义静态歌曲信息
const songList = [
    {
        "rid": "1",
        "name": "Blueming",
        "artist": "IU",
        "album": "Love Poem",
        "bitrate": 320,
        "quality": "高音质 MP3",
        "duration": 215000,
        "size": "8.6 MB",
        "pic": "./images/Blueming.jpg",
        "url": "./music/Blueming.mp3",
        "lyric": "./lyrics/Blueming.lrc",
        "level": {
            "quality": [
                {
                    "quality": "高音质 MP3",
                    "br": "320",
                    "format": "mp3",
                    "size": "8.6Mb",
                    "level": "exhigh"
                }
            ]
        }
    },
    {
        "rid": "2",
        "name": "Celebrity",
        "artist": "IU",
        "album": "IU 5th Album 'LILAC'",
        "bitrate": 320,
        "quality": "高音质 MP3",
        "duration": 239000,
        "size": "9.56 MB",
        "pic": "./images/Celebrity.jpg",
        "url": "./music/Celebrity.mp3",
        "lyric": "./lyrics/Celebrity.lrc",
        "level": {
            "quality": [
                {
                    "quality": "高音质 MP3",
                    "br": "320",
                    "format": "mp3",
                    "size": "9.56Mb",
                    "level": "exhigh"
                }
            ]
        }
    }
];

document.addEventListener('DOMContentLoaded', function () {
    // 获取DOM元素
    const audioPlayer = document.getElementById('audioPlayer');
    const playBtn = document.getElementById('playBtn');
    const playIcon = document.getElementById('playIcon');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const progress = document.getElementById('progress');
    const progressBar = document.getElementById('progressBar');
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');
    const loopBtn = document.getElementById('loopBtn');
    const playlistBtn = document.getElementById('playlistBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const lyricsContainer = document.getElementById('lyricsContainer');
    const playerContainer = document.getElementById('playerContainer');
    const coverImage = document.getElementById('coverImage');
    const lyricsSection = document.getElementById('lyricsSection');
    const toggleLyrics = document.getElementById('toggleLyrics');
    const loading = document.getElementById('loading');
    const playlistContainer = document.getElementById('playlistContainer');
    const closePlaylist = document.getElementById('closePlaylist');
    const playlistItems = document.getElementById('playlistItems');
    const downloadModal = document.getElementById('downloadModal');
    const closeDownloadModal = document.getElementById('closeDownloadModal');
    const downloadOptions = document.getElementById('downloadOptions');
    const confirmDownload = document.getElementById('confirmDownload');
    const coverSection = document.getElementById('coverSection');
    const clearPlaylistBtn = document.getElementById('clearPlaylistBtn');
    const songTitle = document.getElementById('songTitle');
    const songArtist = document.getElementById('songArtist');
    const songAlbum = document.getElementById('songAlbum');
    
    // 音量控制元素
    const volumeBtn = document.getElementById('volumeBtn');
    const volumeIcon = document.getElementById('volumeIcon');
    const volumeSlider = document.getElementById('volumeSlider');
    const pcVolumeBtn = document.getElementById('pcVolumeBtn');
    const pcVolumeIcon = document.getElementById('pcVolumeIcon');
    const pcVolumeSlider = document.getElementById('pcVolumeSlider');

    // 状态变量
    let isDragging = false;
    let wasPlaying = false;
    let isUserInteractingWithLyrics = false;
    let scrollTimeout;
    let ignoreAutoScrollOnce = false;
    let loopMode = 1; // 0: 不循环, 1: 列表循环, 2: 单曲循环
    let selectedQualityIndex = 0;
    let touchStartX = 0;
    let touchStartTime = 0;
    let lyrics = [];
    let currentSongId = new URLSearchParams(window.location.search).get('id') || '1';
    let playlist = JSON.parse(getCookie('musicPlayerPlaylist') || '[]');

    // 初始化播放器
    initPlayer();

    // 初始化播放器
    function initPlayer() {
        // 初始化播放列表（如果没有cookie）
        if (playlist.length === 0) {
            playlist = songList.map(song => ({
                id: song.rid,
                name: song.name,
                artist: song.artist,
                album: song.album,
                duration: formatTime(song.duration / 1000),
                pic: song.pic,
                url: song.url
            }));
            updatePlaylistCookie();
        }

        // 加载当前歌曲
        loadSong(currentSongId);

        // 初始化事件监听
        initEventListeners();

        // 初始化歌词
        initLyrics();

        // 初始化播放列表UI
        updatePlaylistUI();
        
        // 初始化音量控制
        updateVolumeIcon();
    }

    // 初始化事件监听
    function initEventListeners() {
        // 播放控制
        playBtn.addEventListener('click', togglePlay);
        audioPlayer.addEventListener('play', updatePlayState);
        audioPlayer.addEventListener('pause', updatePlayState);

        // 音量控制
        volumeBtn.addEventListener('click', toggleMute);
        volumeSlider.addEventListener('input', updateVolume);
        
        // 悬浮组件音量控制
        document.getElementById('pcPlayBtn').addEventListener('click', togglePlay);
        document.getElementById('pcPrevBtn').addEventListener('click', playPrevious);
        document.getElementById('pcNextBtn').addEventListener('click', playNext);
        document.getElementById('pcLoopBtn').addEventListener('click', toggleLoopMode);
        document.getElementById('pcVolumeBtn').addEventListener('click', toggleMute);
        document.getElementById('pcVolumeSlider').addEventListener('input', updateVolume);
        document.getElementById('pcPlaylistBtn').addEventListener('click', togglePlaylist);
        document.getElementById('pcDownloadBtn').addEventListener('click', showDownloadModal);
        document.getElementById('pcProgressBar').addEventListener('click', setPCProgress);
        // 悬浮组件进度条点击
        function setPCProgress(e) {
            const rect = e.currentTarget.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const percent = Math.min(Math.max(offsetX / rect.width, 0), 1);
            audioPlayer.currentTime = percent * audioPlayer.duration;
            if (!audioPlayer.paused) audioPlayer.play().catch(e => console.log('播放失败:', e));
        }

        // 进度条
        audioPlayer.addEventListener('timeupdate', updateProgress);
        progressBar.addEventListener('click', setProgress);
        audioPlayer.addEventListener('loadedmetadata', updateDuration);

        // 进度条拖动
        progressBar.addEventListener('mousedown', startDrag);
        progressBar.addEventListener('touchstart', startDrag);
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);

        // 控制按钮
        loopBtn.addEventListener('click', toggleLoopMode);
        playlistBtn.addEventListener('click', togglePlaylist);
        prevBtn.addEventListener('click', playPrevious);
        nextBtn.addEventListener('click', playNext);
        audioPlayer.addEventListener('ended', handleSongEnd);

        // 下载
        downloadBtn.addEventListener('click', showDownloadModal);
        closeDownloadModal.addEventListener('click', hideDownloadModal);
        confirmDownload.addEventListener('click', downloadSong);

        // 移动端切换歌词
        toggleLyrics.addEventListener('click', toggleLyricsView);

        // 播放列表
        closePlaylist.addEventListener('click', togglePlaylist);
        clearPlaylistBtn?.addEventListener('click', clearPlaylist);

        // 播放列表项点击
        playlistItems.addEventListener('click', handlePlaylistItemClick);

        // 下载选项选择
        document.querySelectorAll('.download-option').forEach(option => {
            option.addEventListener('click', selectDownloadOption);
        });

        // 歌词点击跳转
        lyricsContainer.addEventListener('click', handleLyricClick);

        // 歌词容器滚动事件
        lyricsContainer.addEventListener('scroll', handleLyricsScroll);

        // 触摸事件
        playerContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
        playerContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
        playerContainer.addEventListener('touchend', handleTouchEnd, { passive: true });

        // 监听URL变化
        window.addEventListener('popstate', handlePopState);
    }

    // 初始化歌词
    function initLyrics() {
        const lyricLines = document.querySelectorAll('.lyric-line');
        lyricLines.forEach(line => {
            lyrics.push({
                time: parseFloat(line.dataset.time),
                text: line.textContent
            });
        });
    }

    // 加载歌曲
    function loadSong(songId, autoPlay = true) {
        if (!songId) return;

        currentSongId = songId;
        loading.classList.remove('hidden');

        // 更新URL不刷新页面
        const newUrl = window.location.pathname + '?id=' + songId;
        history.pushState({ songId }, '', newUrl);

        // 从静态数据中查找歌曲
        const songData = songList.find(song => song.rid === songId);
        if (!songData) {
            showError('未找到歌曲');
            loading.classList.add('hidden');
            return;
        }

        // 加载歌词文件
        fetch(songData.lyric)
            .then(response => response.text())
            .then(lyricText => {
                // 更新歌曲数据中的歌词
                const updatedSongData = { ...songData, lyric: lyricText };
                
                // 更新播放器UI
                updatePlayerUI(updatedSongData);

                // 自动播放
                if (autoPlay) {
                    audioPlayer.play().catch(e => {
                        console.log('自动播放失败:', e);
                        loading.classList.add('hidden');
                    });
                } else {
                    loading.classList.add('hidden');
                }
            })
            .catch(error => {
                console.error('加载歌词失败:', error);
                // 即使歌词加载失败，也要更新播放器UI
                updatePlayerUI(songData);
                loading.classList.add('hidden');
            });
    }

    // 更新播放器UI
    function updatePlayerUI(songInfo) {
        // 更新音频源
        audioPlayer.src = songInfo.url || '';

        // 更新封面 - 主封面
        if (songInfo.pic) {
            coverImage.src = songInfo.pic;
            document.body.style.setProperty('--bg-image', `url('${songInfo.pic}')`);
            // 更新悬浮组件封面
            const pcCoverImage = document.getElementById('pcCoverImage');
            if (pcCoverImage) pcCoverImage.src = songInfo.pic;
        }

        // 更新歌曲信息 - 主信息
        songTitle.textContent = songInfo.name || '无歌曲';
        songArtist.textContent = songInfo.artist || '';
        songAlbum.textContent = songInfo.album || '';
        durationEl.textContent = formatTime(songInfo.duration / 1000) || '00:00';

        // 更新悬浮组件信息
        const pcSongTitle = document.getElementById('pcSongTitle');
        const pcSongArtist = document.getElementById('pcSongArtist');
        if (pcSongTitle) pcSongTitle.textContent = songInfo.name || '无歌曲';
        if (pcSongArtist) pcSongArtist.textContent = songInfo.artist || '';

        // 更新歌词
        updateLyrics(songInfo.lyric || '');

        // 更新下载选项
        updateDownloadOptions(songInfo.level?.quality || []);

        // 更新当前播放状态
        updateActivePlaylistItem();
    }

    // 更新歌词
    function updateLyrics(lyricText) {
        lyricsContainer.innerHTML = '';
        lyrics = [];

        if (!lyricText) {
            lyricsContainer.innerHTML = '<div class="no-lyrics">暂无歌词</div>';
            return;
        }

        const lines = lyricText.split('\n');
        lines.forEach(line => {
            if (line.match(/^\[\d+:\d+\.\d+\]/)) {
                const matches = line.match(/^\[(\d+):(\d+)\.(\d+)\]/);
                const minutes = matches[1];
                const seconds = matches[2];
                const milliseconds = matches[3];
                const time = minutes * 60 + parseInt(seconds) + milliseconds / 1000;
                const text = line.replace(/^\[\d+:\d+\.\d+\]/, '').trim();

                const lineElement = document.createElement('div');
                lineElement.className = 'lyric-line';
                lineElement.dataset.time = time;
                lineElement.textContent = text;
                lyricsContainer.appendChild(lineElement);

                lyrics.push({ time, text });
            }
        });
    }

    // 更新下载选项
    function updateDownloadOptions(qualities) {
        downloadOptions.innerHTML = '';

        if (qualities.length === 0) {
            downloadOptions.innerHTML = '<div class="no-options">无可用下载选项</div>';
            return;
        }

        qualities.forEach((quality, index) => {
            const option = document.createElement('div');
            option.className = `download-option ${index === 0 ? 'active' : ''}`;
            option.dataset.index = index;
            option.dataset.level = quality.level;

            const name = document.createElement('div');
            name.className = 'download-option-name';
            name.textContent = quality.quality || '未知音质';

            const details = document.createElement('div');
            details.className = 'download-option-details';
            details.innerHTML = `
                <span>${(quality.format || '').toUpperCase()}</span>
                <span>${quality.size || ''}</span>
            `;

            option.appendChild(name);
            option.appendChild(details);
            option.addEventListener('click', selectDownloadOption);

            downloadOptions.appendChild(option);
        });

        selectedQualityIndex = 0;
    }

    // 添加到播放列表
    function addToPlaylist(songInfo) {
        if (!songInfo || !songInfo.rid) return;

        // 检查是否已存在
        const exists = playlist.some(item => item.id === songInfo.rid);
        if (exists) return;

        // 添加到播放列表
        const playlistItem = {
            id: songInfo.rid,
            name: songInfo.name,
            artist: songInfo.artist,
            album: songInfo.album,
            duration: formatTime(songInfo.duration / 1000),
            pic: songInfo.pic,
            url: songInfo.url
        };

        playlist.unshift(playlistItem);
        updatePlaylistCookie();
        updatePlaylistUI();
    }

    // 更新播放列表UI
    function updatePlaylistUI() {
        playlistItems.innerHTML = '';

        if (playlist.length === 0) {
            playlistItems.innerHTML = '<div class="playlist-empty">播放列表为空</div>';
            return;
        }

        // 添加清空按钮
        const clearBtn = document.createElement('div');
        clearBtn.className = 'playlist-clear-btn';
        clearBtn.id = 'clearPlaylistBtn';
        clearBtn.innerHTML = '<i class="fas fa-trash"></i> 清空播放列表';
        clearBtn.addEventListener('click', clearPlaylist);
        playlistItems.appendChild(clearBtn);

        // 添加所有歌曲到播放列表
        playlist.forEach(song => {
            const item = document.createElement('div');
            item.className = `playlist-item ${song.id === currentSongId ? 'active' : ''}`;
            item.dataset.id = song.id;

            item.innerHTML = `
            <img src="${song.pic || ''}" alt="${song.name || ''}">
            <div class="playlist-item-info">
                <div class="playlist-item-title">${song.name || '未知歌曲'}</div>
                <div class="playlist-item-artist">${song.artist || '未知歌手'}</div>
            </div>
            <button class="playlist-item-remove"><i class="fas fa-times"></i></button>
        `;

            playlistItems.appendChild(item);
        });
    }

    // 更新当前播放的播放列表项
    function updateActivePlaylistItem() {
        document.querySelectorAll('.playlist-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === currentSongId);
        });
    }

    // 更新播放列表Cookie
    function updatePlaylistCookie() {
        // 设置过期时间为30天
        const date = new Date();
        date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();

        document.cookie = `musicPlayerPlaylist=${JSON.stringify(playlist)}; ${expires}; path=/`;
    }

    // 播放/暂停
    function togglePlay() {
        if (audioPlayer.paused) {
            audioPlayer.play().catch(e => {
                showError('播放失败，请点击播放按钮重试');
            });
        } else {
            audioPlayer.pause();
        }
    }

    // 更新播放状态
    function updatePlayState() {
        const isPlaying = !audioPlayer.paused;

        // 主播放器
        playIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
        playerContainer.classList.toggle('playing', isPlaying);
        updateTooltip(playBtn, isPlaying ? '暂停' : '播放');

        // 悬浮组件
        const pcPlayIcon = document.getElementById('pcPlayIcon');
        if (pcPlayIcon) {
            pcPlayIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
        }
    }

    function updateProgress() {
        if (isDragging) return;

        const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;

        // 主进度条
        progress.style.width = `${progressPercent}%`;
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);

        // 悬浮组件进度条
        const pcProgress = document.getElementById('pcProgress');
        if (pcProgress) {
            pcProgress.style.width = `${progressPercent}%`;
        }

        updateCurrentLyric(audioPlayer.currentTime);
    }
    // 更新当前歌词
    function updateCurrentLyric(currentTime) {
        const lyricLines = document.querySelectorAll('.lyric-line');
        let activeLine = null;

        for (let i = lyrics.length - 1; i >= 0; i--) {
            if (currentTime >= lyrics[i].time) {
                activeLine = i;
                break;
            }
        }

        lyricLines.forEach((line, index) => {
            line.classList.toggle('active', index === activeLine);
        });

        if (!isUserInteractingWithLyrics && activeLine !== null && lyricLines[activeLine]) {
            const container = lyricsContainer;
            const line = lyricLines[activeLine];
            const lineTop = line.offsetTop;
            const lineHeight = line.offsetHeight;
            const containerHeight = container.offsetHeight;
            const lineBottom = lineTop + lineHeight;
            const containerScrollTop = container.scrollTop;
            const containerScrollBottom = containerScrollTop + containerHeight;

            if (lineTop < containerScrollTop || lineBottom > containerScrollBottom) {
                container.scrollTo({
                    top: lineTop - containerHeight / 2 + lineHeight,
                    behavior: 'smooth'
                });
            }
        }
    }

    // 设置进度
    function setProgress(e) {
        const rect = progressBar.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const percent = Math.min(Math.max(offsetX / rect.width, 0), 1);
        audioPlayer.currentTime = percent * audioPlayer.duration;
        if (!audioPlayer.paused) audioPlayer.play().catch(e => console.log('播放失败:', e));
    }

    // 开始拖动进度条
    function startDrag(e) {
        isDragging = true;
        wasPlaying = !audioPlayer.paused;
        if (wasPlaying) audioPlayer.pause();
        progressBar.classList.add('dragging');
        updateProgressOnDrag(e.touches ? e.touches[0] : e);
        e.preventDefault();
    }

    // 处理拖动移动
    function handleDragMove(e) {
        if (!isDragging) return;
        updateProgressOnDrag(e.touches ? e.touches[0] : e);
        if (e.touches) e.preventDefault();
    }

    // 结束拖动
    function endDrag(e) {
        if (!isDragging) return;

        isDragging = false;
        progressBar.classList.remove('dragging');
        const rect = progressBar.getBoundingClientRect();
        const touch = e.touches ? e.changedTouches[0] : e;
        const offsetX = touch.clientX - rect.left;
        const percent = Math.min(Math.max(offsetX / rect.width, 0), 1);
        audioPlayer.currentTime = percent * audioPlayer.duration;

        if (wasPlaying) audioPlayer.play().catch(e => console.log('播放失败:', e));
    }

    // 更新拖动时的进度显示
    function updateProgressOnDrag(e) {
        const rect = progressBar.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const percent = Math.min(Math.max(offsetX / rect.width, 0), 1);
        progress.style.width = `${percent * 100}%`;
        currentTimeEl.textContent = formatTime(percent * audioPlayer.duration);
        updateCurrentLyric(percent * audioPlayer.duration);
    }

    // 更新时长显示
    function updateDuration() {
        durationEl.textContent = formatTime(audioPlayer.duration);
    }

    // 切换循环模式
    function toggleLoopMode() {
        loopMode = (loopMode + 1) % 3;
        updateLoopButton();
        audioPlayer.loop = loopMode === 2;
    }

    // 更新循环按钮
    function updateLoopButton() {
        const icons = ['fa-repeat', 'fa-list-ol', 'fa-repeat'];
        const titles = ['不循环', '列表循环', '单曲循环'];

        // 主循环按钮
        loopBtn.innerHTML = `<i class="fas ${icons[loopMode]}"></i><span class="tooltip">${titles[loopMode]}</span>`;
        loopBtn.classList.toggle('active', loopMode !== 0);

        // 悬浮组件循环按钮
        const pcLoopBtn = document.getElementById('pcLoopBtn');
        const pcLoopIcon = document.getElementById('pcLoopIcon');
        if (pcLoopBtn && pcLoopIcon) {
            pcLoopIcon.className = `fas ${icons[loopMode]}`;
            pcLoopBtn.classList.toggle('active', loopMode !== 0);
        }
    }

    // 更新音量
    function updateVolume(e) {
        const volume = parseFloat(e.target.value);
        audioPlayer.volume = volume;
        
        // 同步两个滑块的值
        if (e.target.id === 'volumeSlider') {
            document.getElementById('pcVolumeSlider').value = volume;
        } else {
            volumeSlider.value = volume;
        }
        
        updateVolumeIcon();
    }
    
    // 切换静音
    function toggleMute() {
        const wasMuted = audioPlayer.muted;
        audioPlayer.muted = !wasMuted;
        
        // 如果是从静音状态恢复，保持之前的音量值
        if (!audioPlayer.muted && wasMuted) {
            updateVolumeIcon();
        } else {
            updateVolumeIcon();
        }
    }
    
    // 更新音量图标
    function updateVolumeIcon() {
        let iconClass;
        if (audioPlayer.muted || audioPlayer.volume === 0) {
            iconClass = 'fa-volume-xmark';
        } else if (audioPlayer.volume < 0.5) {
            iconClass = 'fa-volume-low';
        } else {
            iconClass = 'fa-volume-high';
        }
        
        volumeIcon.className = `fas ${iconClass}`;
        const pcVolumeIcon = document.getElementById('pcVolumeIcon');
        if (pcVolumeIcon) {
            pcVolumeIcon.className = `fas ${iconClass}`;
        }
    }
    
    // 切换播放列表
    function togglePlaylist() {
        playlistContainer.classList.toggle('show');
    }

    // 播放上一首
    function playPrevious() {
        if (audioPlayer.currentTime > 3) {
            audioPlayer.currentTime = 0;
            return;
        }

        const currentIndex = playlist.findIndex(item => item.id === currentSongId);
        if (currentIndex > 0) {
            loadSong(playlist[currentIndex - 1].id, !audioPlayer.paused);
        } else if (loopMode === 1) {
            // 列表循环，回到最后一首
            loadSong(playlist[playlist.length - 1].id, !audioPlayer.paused);
        }
    }

    // 播放下一首
    function playNext() {
        const currentIndex = playlist.findIndex(item => item.id === currentSongId);

        if (currentIndex < playlist.length - 1) {
            loadSong(playlist[currentIndex + 1].id, !audioPlayer.paused);
        } else if (loopMode === 1) {
            // 列表循环，回到第一首
            loadSong(playlist[0].id, !audioPlayer.paused);
        }
    }

    // 处理歌曲结束
    function handleSongEnd() {
        if (loopMode === 1) playNext();
        else if (loopMode === 2) {
            audioPlayer.currentTime = 0;
            audioPlayer.play();
        }
    }

    // 显示下载弹窗
    function showDownloadModal() {
        downloadModal.classList.add('show');
    }

    // 隐藏下载弹窗
    function hideDownloadModal() {
        downloadModal.classList.remove('show');
    }

    // 下载歌曲
    function downloadSong() {
        const songId = currentSongId;
        if (!songId) {
            showNotification('无法获取歌曲ID');
            return;
        }

        const songData = songList.find(song => song.rid === songId);
        if (!songData) {
            showNotification('未找到歌曲数据');
            return;
        }

        const qualityOptions = document.querySelectorAll('.download-option');
        if (qualityOptions.length === 0) {
            showNotification('没有可用的下载选项');
            return;
        }

        const selectedOption = document.querySelector('.download-option.active');
        const qualityLevel = selectedOption ? selectedOption.dataset.level : 'exhigh';

        // 隐藏下载弹窗
        hideDownloadModal();

        // 显示下载提示
        showNotification('开始下载歌曲...');

        // 创建下载链接
        const downloadUrl = songData.url; // 使用当前歌曲的URL
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${songData.name || 'song'}.${selectedOption ? selectedOption.querySelector('.download-option-details span').textContent.toLowerCase() : 'mp3'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // 选择下载选项
    function selectDownloadOption(e) {
        const option = e.currentTarget;
        selectedQualityIndex = parseInt(option.dataset.index);
        document.querySelectorAll('.download-option').forEach(el => {
            el.classList.remove('active');
        });
        option.classList.add('active');
    }

    // 清空播放列表
    function clearPlaylist() {
        showCustomConfirm('确定要清空播放列表吗？', function () {
            showNotification('准备重新加载页面');
            setTimeout(function () {
                document.cookie = 'musicPlayerPlaylist=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                window.location.href = window.location.pathname;
            }, 500);
        });
    }

    // 从播放列表移除歌曲
    function removeSongFromPlaylist(songId) {
        playlist = playlist.filter(item => item.id !== songId);
        updatePlaylistCookie();
        updatePlaylistUI();
        showNotification('已从播放列表移除');
    }

    // 切换歌词视图
    function toggleLyricsView() {
        lyricsSection.classList.toggle('active');
        coverSection.classList.toggle('hide');
        const isShowingLyrics = lyricsSection.classList.contains('active');
        toggleLyrics.innerHTML = isShowingLyrics ?
            '<i class="fas fa-music"></i> 返回封面' :
            '<i class="fas fa-align-left"></i> 查看歌词';
    }

    // 处理播放列表项点击
    function handlePlaylistItemClick(e) {
        // 处理删除按钮点击
        if (e.target.classList.contains('playlist-item-remove') ||
            e.target.classList.contains('fa-times')) {
            e.stopPropagation();
            const item = e.target.closest('.playlist-item');
            const songId = item.dataset.id;
            removeSongFromPlaylist(songId);
            return;
        }

        // 处理播放列表项点击
        const item = e.target.closest('.playlist-item');
        if (item) {
            const songId = item.dataset.id;
            loadSong(songId, !audioPlayer.paused);
        }
    }

    // 处理歌词点击
    function handleLyricClick(e) {
        if (e.target.classList.contains('lyric-line')) {
            const time = parseFloat(e.target.dataset.time);
            audioPlayer.currentTime = time;
            if (audioPlayer.paused) audioPlayer.play();
            ignoreAutoScrollOnce = true;
        }
    }

    // 处理歌词滚动
    function handleLyricsScroll() {
        isUserInteractingWithLyrics = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isUserInteractingWithLyrics = false;
        }, 2000);
    }

    // 处理URL变化
    function handlePopState(e) {
        const songId = e.state?.songId || new URLSearchParams(window.location.search).get('id');
        if (songId && songId !== currentSongId) {
            loadSong(songId, !audioPlayer.paused);
        }
    }

    // 触摸开始处理
    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
    }

    // 触摸移动处理
    function handleTouchMove(e) {
        if (window.innerWidth > 768) return;
        const touchX = e.touches[0].clientX;
        const diffX = touchX - touchStartX;
        const isLyricsActive = lyricsSection.classList.contains('active');
        if ((isLyricsActive && diffX > 0) || (!isLyricsActive && diffX < 0)) {
            if (e.cancelable) {  // 只有可取消的事件才阻止默认行为
                e.preventDefault();
            }
        }
    }

    // 触摸结束处理
    function handleTouchEnd(e) {
        if (window.innerWidth > 768) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diffX = touchEndX - touchStartX;
        const diffTime = Date.now() - touchStartTime;
        const isLyricsActive = lyricsSection.classList.contains('active');
        if (Math.abs(diffX) > 50 && diffTime < 300) {
            if (diffX > 0 && isLyricsActive) toggleLyricsView();
            else if (diffX < 0 && !isLyricsActive) toggleLyricsView();
        }
    }

    // 显示错误信息
    function showError(message) {
        loading.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 50px; margin-bottom: 15px;">😢</div>
                <div class="error-message">${message}</div>
                <button class="retry-btn" id="retryBtn" style="margin-top: 20px;">
                    <i class="fas fa-sync-alt"></i> 重试
                </button>
            </div>
        `;
        loading.style.display = 'flex';

        document.getElementById('retryBtn').addEventListener('click', function () {
            audioPlayer.load();
            audioPlayer.play().catch(e => {
                showError('仍然无法播放，请检查网络');
            });
        });
    }

    // 辅助函数
    function updateTooltip(button, text) {
        const tooltip = button.querySelector('.tooltip');
        if (tooltip) tooltip.textContent = text;
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            const encodedValue = parts.pop().split(';').shift();
            return decodeURIComponent(encodedValue);
        }
        return null;
    }

    // 显示通知提示
    function showNotification(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff5d9e;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-size: 14px;
            font-weight: 500;
            opacity: 0;
            transition: opacity 0.3s, transform 0.3s;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translate(-50%, -10px)';
        }, 100);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translate(-50%, 10px)';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // 自定义确认框
    function showCustomConfirm(message, onConfirm) {
        const confirmBox = document.createElement('div');
        confirmBox.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1001;
        `;

        const box = document.createElement('div');
        box.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            width: 300px;
            text-align: center;
        `;
        const messageElem = document.createElement('p');
        messageElem.textContent = message;
        messageElem.style.fontSize = '16px';
        messageElem.style.marginBottom = '20px';

        const buttons = document.createElement('div');
        buttons.style.display = 'flex';
        buttons.style.justifyContent = 'space-around';

        const yesButton = document.createElement('button');
        yesButton.textContent = '确定';
        yesButton.style.cssText = `
            padding: 8px 16px;
            background-color: #ff5d9e;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;
        yesButton.onclick = function () {
            onConfirm();
            document.body.removeChild(confirmBox);
        };

        const noButton = document.createElement('button');
        noButton.textContent = '取消';
        noButton.style.cssText = `
            padding: 8px 16px;
            background-color: #ccc;
            color: black;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;
        noButton.onclick = function () {
            document.body.removeChild(confirmBox);
        };

        buttons.appendChild(yesButton);
        buttons.appendChild(noButton);
        box.appendChild(messageElem);
        box.appendChild(buttons);
        confirmBox.appendChild(box);
        document.body.appendChild(confirmBox);
    }


    // 初始化循环按钮
    updateLoopButton();
});

console.log(
    "\n%c %c %c" + " ✰ " + " 笒鬼鬼Api " + " ✰ " + " %c  %c  api.cenguigui.cn  %c %c ♥%c♥%c♥ \n\n",
    "background: #ff66a5; padding:5px 0;",
    "background: #ff66a5; padding:5px 0;",
    "color: #ff66a5; background: #030307; padding:5px 0;",
    "background: #ff66a5; padding:5px 0;",
    "background: #ffc3dc; padding:5px 0;",
    "background: #ff66a5; padding:5px 0;",
    "color: #ff2424; background: #fff; padding:5px 0;",
    "color: #ff2424; background: #fff; padding:5px 0;",
    "color: #ff2424; background: #fff; padding:5px 0;"
);
