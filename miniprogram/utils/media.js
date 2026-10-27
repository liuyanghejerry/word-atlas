const full = (id) => `/media-full/img/${id}.webp`;
const thumb = (id) => `/media-thumb/thumb/${id}.webp`;
const zh = (id) => `/media-zh/audio/zh/${id}.mp3`;
const zhEx = (id) => `/media-zh/audio/zh-ex/${id}.mp3`;
const zhWord = (id, index) => `/media-zh-word/audio/zh-word/${id}-${index}.mp3`;
const us = (id) => `/media-en/audio/us/${id}.mp3`;
const enUs = (id) => `/media-en/audio/en-us/${id}.mp3`;
const sfx = (name) => `/media-en/sfx/${name}.mp3`;

module.exports = { full, thumb, zh, zhEx, zhWord, us, enUs, sfx };
