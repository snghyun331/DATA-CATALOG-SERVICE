import { ENV_PATH } from '../constant/path';
import * as fs from 'fs';

/* env파일에 value를 추가하는 함수 */
export function updateEnvFile(values: object) {
  const envPath: string = ENV_PATH;
  const originalLines: string[] = fs.readFileSync(envPath, 'utf-8').split('\n');

  // 기존 키 목록 만들기: 키만 추출 & 빈줄('') 제거
  const existingKeys: string[] = originalLines.map((line) => line.split('=')[0].trim()).filter((key) => key.length > 0);

  // 새 변수 중 기존에 없는 변수만 추가
  const newLines: string[] = Object.entries(values)
    .filter(([key]) => !existingKeys.includes(key))
    .map(([key, value]) => `${key}=${value}`);

  // 기존 줄 + 새 줄
  const finalContent: string = [...originalLines, ...newLines].join('\n');

  fs.writeFileSync(envPath, finalContent, { encoding: 'utf-8' });
}
