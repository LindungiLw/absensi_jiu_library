import os
import re
import urllib.request

css_url = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700;800&display=swap"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}

req = urllib.request.Request(css_url, headers=headers)
with urllib.request.urlopen(req) as response:
    css_content = response.read().decode('utf-8')

font_dir = "assets/fonts/poppins"
if not os.path.exists(font_dir):
    os.makedirs(font_dir)

# Find all url(...) in CSS
urls = re.findall(r'url\((https://[^)]+)\)', css_content)

for i, url in enumerate(urls):
    filename = url.split('/')[-1]
    local_path = os.path.join(font_dir, filename)
    print(f"Downloading {url} to {local_path}...")
    urllib.request.urlretrieve(url, local_path)
    # Replace URL in CSS
    css_content = css_content.replace(url, f"../fonts/poppins/{filename}")

with open("assets/css/poppins.css", "w") as f:
    f.write(css_content)

print("Done downloading Poppins.")
