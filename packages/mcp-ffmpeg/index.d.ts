export declare function run(cmd: 'ffmpeg' | 'ffprobe', args: string[], timeout?: number): Promise<{ ok: boolean; stdout: string; stderr: string }>;
