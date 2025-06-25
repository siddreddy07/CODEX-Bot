import fs from 'fs'
import path from 'path'
import { genAI } from '../models/llamamodel.js'
import crypto from 'crypto'


const CACHE_FILE = 'cache.json';
let hashCache = {};

if (fs.existsSync(CACHE_FILE)) {
  try {
    const data = fs.readFileSync(CACHE_FILE, 'utf-8').trim();
    hashCache = data ? JSON.parse(data) : {};
  } catch (err) {
    console.error("❌ Error reading .cache.json:", err.message);
    hashCache = {};
  }
}



function getjsfiles(folderpath){

    const allfiles = fs.readdirSync(folderpath)
    console.log('Files Found : ',allfiles)

    const jsfiles = allfiles.filter(file=>{

        return file.endsWith('.js') 

    })
    console.log('Only Js File(s) Available : ',jsfiles)

    return jsfiles
}

function readFileContent(folderpath,filename){

    const filePath = path.join(folderpath,filename)
    const content = fs.readFileSync(filePath,'utf-8');
    return content 

}


function getMeaningfulCode(code) {
  return code
    .replace(/\/\/.*$/gm, '')         // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\s+/g, ' ')             // Collapse all whitespace
    .trim();
}

function getSmartHash(code) {
  const meaningful = getMeaningfulCode(code);
  return crypto.createHash('sha256').update(meaningful).digest('hex');
}


export const generatedocs = async(folderpath)=>{

    try {
        
            if(!fs.existsSync(folderpath)){
                console.log("❌ Provided Folder doesn't exists");
                return
            }
        
            const jsfiles = getjsfiles(folderpath)
        
            if(jsfiles.length === 0){
                console.log("❕No Js Files Found")
                return
            }
        
            for (const file of jsfiles) {
                console.log('🗒️ Processing File : ',file)
        
                const data = readFileContent(folderpath,file)
        
                const currenthash = getSmartHash(data)
        
                if(hashCache[file] === currenthash){
                    console.log(`⚠️ Skipping (no meaningful change) : ${file}`)
                    continue
                }
        
                hashCache[file] = currenthash
        
                console.log('🔍 Learning what is inside ',file)
                const reply = await genAI({type:'doc',code :data ,message : ''})
        
                const outputfilename = file.replace('.js','.md')
                const outputpath = path.join('docs',outputfilename)
        
                fs.writeFileSync(CACHE_FILE, JSON.stringify(hashCache, null, 2));
                fs.writeFileSync(outputpath,`${file}\n\n${reply}`)
                console.log(`✅ Saved : docs/${outputfilename}`)
            }
        
            console.log("🎉 All Files Documented")
            return true
        
    } catch (error) {
        console.log('Error',error.message)
        return false
    }

}