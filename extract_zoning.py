import re

try:
    with open("2014-14 - Refondu - Règlement Zonage.doc", "rb") as f:
        content = f.read()
        # Decode as utf-8 ignoring errors, or latin-1
        text = content.decode("latin-1", errors="ignore")
        
        # Clean up control characters
        clean_text = re.sub(r'[^\x20-\x7E\r\n\t]+', '', text)
        
        # Find 11.1.8
        match = re.search(r"11\.1\.8", clean_text)
        if match:
            start = match.start()
            print(f"Found match at {start}")
            # Print context
            print(clean_text[start:start+2000])
        else:
            print("11.1.8 not found in text.")

except Exception as e:
    print(f"Error: {e}")
