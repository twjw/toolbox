import path from "path";
import fs from "fs";

const dir1 = path.resolve(__dirname, 'test-folder/aaa')
const dir2 = path.resolve(__dirname, 'test-folder/bbb')

function merge () {
  fs.readdirSync(dir1)
}

merge()
