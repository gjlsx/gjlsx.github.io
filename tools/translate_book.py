import os
import sys
import codecs
from deep_translator import GoogleTranslator
import time
import re

# Force stdout to UTF-8
sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

def split_text(text, max_length=3000):
    """Splits text into chunks by paragraphs to respect max_length."""
    paragraphs = text.split('\n')
    chunks = []
    current_chunk = ""

    for p in paragraphs:
        if len(current_chunk) + len(p) + 1 > max_length:
            if current_chunk:
                chunks.append(current_chunk)
            # If a single paragraph is too long, split by sentences (rudimentary)
            if len(p) > max_length:
                sentences = re.split(r'(?<=[.!?]) +', p)
                current_chunk = ""
                for s in sentences:
                    if len(current_chunk) + len(s) + 1 > max_length:
                        if current_chunk:
                            chunks.append(current_chunk)
                        current_chunk = s + " "
                    else:
                        current_chunk += s + " "
            else:
                current_chunk = p + "\n"
        else:
            current_chunk += p + "\n"
    if current_chunk:
        chunks.append(current_chunk)
    return chunks

def translate_file(input_path, output_path):
    print(f"Reading {input_path}...")
    with open(input_path, 'r', encoding='utf-8') as f:
        text = f.read()

    print(f"Total characters: {len(text)}")
    chunks = split_text(text, 3000)
    print(f"Split into {len(chunks)} chunks.")

    translator = GoogleTranslator(source='en', target='zh-CN')

    with open(output_path, 'w', encoding='utf-8') as out_f:
        for i, chunk in enumerate(chunks):
            if not chunk.strip():
                continue
            print(f"Translating chunk {i+1}/{len(chunks)}...")
            try:
                translated = translator.translate(chunk)
                if translated:
                    out_f.write(translated + "\n\n")
                    out_f.flush()
                # Rate limit protection
                time.sleep(1) 
            except Exception as e:
                print(f"Error on chunk {i+1}: {e}")
                time.sleep(5)
                # Retry once
                try:
                    translated = translator.translate(chunk)
                    if translated:
                        out_f.write(translated + "\n\n")
                        out_f.flush()
                except Exception as e2:
                    print(f"Retry failed: {e2}")
                    out_f.write("\n[TRANSLATION FAILED FOR THIS SECTION]\n\n")

    print(f"Translation completed! Saved to {output_path}")

if __name__ == '__main__':
    input_file = r'docs\The_New_Class_raw.txt'
    output_file = r'F:\temp\docs\The_New_Class_Chinese.txt'
    translate_file(input_file, output_file)
