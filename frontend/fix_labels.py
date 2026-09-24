import re
import os

def fix_jsx(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find labels without htmlFor that are followed by an input/select/textarea
    pattern = re.compile(
        r'<label className="([^"]+)">([^<]+)</label>\s*<(input|select|textarea)\s+(?:[^>]*?)name="([^"]+)"',
        re.DOTALL
    )
    
    def repl(m):
        class_name = m.group(1)
        label_text = m.group(2)
        tag = m.group(3)
        name = m.group(4)
        
        # reconstruct
        full_match = m.group(0)
        new_label = f'<label htmlFor="{name}" className="{class_name}">{label_text}</label>\n        <{tag}\n          id="{name}"'
        
        # Replace only the first part of the full match
        return re.sub(
            r'<label className="[^"]+">[^<]+</label>\s*<' + tag,
            f'<label htmlFor="{name}" className="{class_name}">{label_text}</label>\n        <{tag} id="{name}"',
            full_match,
            count=1
        )

    new_content = pattern.sub(repl, content)
    
    # Also handle cases where type="text" comes before name
    # We can just run a general replacement
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {file_path}")

for file in os.listdir('src/components'):
    if file.endswith('.jsx'):
        fix_jsx('src/components/' + file)

for file in os.listdir('src/pages'):
    if file.endswith('.jsx'):
        fix_jsx('src/pages/' + file)
