import sys
import os
import platform
from pathlib import Path
import re
import shutil
import json
import send2trash

peizhi_name = 'testmy' # 选择你要配置的那个名字, 建议先创建一个mytest 账号的配置文件, 
# 命令行 运行 /Applications/Zotero.app/Contents/MacOS/zotero -P  即可创建配置文件, 
# 默认的配置文件为 default, 你可以在配置文件中修改配置文件的名字,
def main():
    ### 根据操作系统确定插件的路径
    if sys.platform.startswith('win'):
        d = r'C:\Users\Administrator\Documents\GitHub\zotero-plugin-template' # win 插件的目录
        root_dir = Path(d)
        zotero_path = r'C:\kk\Zotero'        # zotero 软件的目录.即 zotero.exe所在的目录(win )
    else:
        d = '/Users/zsc/Desktop/mygithub/zotero-journalabbr' #  mac 的插件的目录
        root_dir = Path(d)
        zotero_path = r'/Applications/Zotero.app/Contents/MacOS' # mac 中zotero 软件的目录
    os.chdir(root_dir)

    ######### 1. 复制  zotero-cmd.json
    source_file = Path('./scripts/zotero-cmd-default.json')
    target_file = Path('./scripts/zotero-cmd.json')
    shutil.copy(source_file,target_file) # 使用 copy() 函数复制文件
    
    ####### 2. 对  zotero-cmd.json 的内容进行修改
    modify_zotero_cmd_json(target_file, zotero_path) # 其中  zotero_path 是文件中要替换的字符串

    ####### 3. 获取extensions文件夹的路径
    zotero_config_dir = get_zotero_config_dir() 
    zotero_config_dir_extensions = os.path.join(zotero_config_dir, 'extensions')
    print('=====zotero的配置目录: ====\n '+zotero_config_dir)
    print('=====extensions文件夹的路径: ====\n '+zotero_config_dir_extensions)

    ###### 4. 在 extensions 文件夹中创建一个以  package.json 中的 addonID字段值 为名的文件, 
    # （例如，myplugin@mydomain.org，此处应与package.json中的addonID一致). 
    #  该文件的内容为  是插件编译后的源代码绝对路径（例如，插件路径/builds/addon）。
    #### 4.1 获取 package.json 中的 addonID字段值
    addon_id = get_addon_id()
    mkfile = os.path.join(zotero_config_dir_extensions, addon_id) # 生成要创建的路径
    create_addon_file(mkfile) # 创建文件并写入内容
    print('=====创建的文件路径: ====\n '+mkfile)

    # 4. 返回上一级（Zotero配置文件目录），打开prefs.js，并删除包含extensions.lastAppBuildId 和extensions.lastAppVersion的行。
    clean_prefs_js(zotero_config_dir)



def modify_zotero_cmd_json(file_path: Path, zotero_path: str) -> None:
    """修改 zotero-cmd.json 文件 -- 根据操作系统调用不同的函数进行处理"""
    if sys.platform.startswith('win'):
        modify_zotero_cmd_json_win(file_path, zotero_path)
    elif sys.platform == 'darwin':
        modify_zotero_cmd_json_mac(file_path, zotero_path)
    else:
        print("Unknown platform:", platform.system())

def modify_zotero_cmd_json_win(file_path: Path, zotero_path: str) -> None:
    ####1. 打开文件进行读取 --  处理字段问题
    with open(file_path, "r") as f:
        lines = f.readlines()
    # 处理每一行
    i = 0
    while i < len(lines):
        if "killZoteroWindows" in lines[i]:
            #lines[i] = lines[i].replace("killZoteroWindows", "killZoteroWindows")
            lines.insert(i+1, '  "startZotero": "/path/to/zotero.exe --debugger --purgecaches",\n')
        i += 1  # 自增索引

    # 写回到文件中
    with open(file_path, "w") as f:
        f.writelines(lines)

    ###### 2. 替换 /path/to  为 zotero 所在的目录
    with open(file_path, "r") as f:
        content = f.read()
    temp = os.path.normpath(zotero_path).replace('\\', '/')# 把 win 的目录转义为 mac 的目录
    content = content.replace("/path/to", temp)
    # 写回到文件中
    with open(file_path, "w") as f:
        f.write(content)

    ##### 3. 处理 zotero.exe 的问题
    with open(file_path, 'r') as f:
        file_content = f.read()
    file_content = re.sub(r'zotero[0-9]{0,1}\.exe', 'zotero.exe', file_content)
    with open(file_path, 'w') as f:
        f.write(file_content)

def modify_zotero_cmd_json_mac(file_path: Path, zotero_path: str) -> None:
    ####1. 打开文件进行读取 --  处理字段问题
    with open(file_path, "r") as f:
        lines = f.readlines()
    # 处理每一行
    i = 0
    while i < len(lines):
        if "killZoteroUnix" in lines[i]:
            #lines[i] = lines[i].replace("killZoteroUnix", "killZoteroUnix")
            lines.insert(i+1, '  "startZotero": "/path/to/zotero.exe --debugger --purgecaches",\n')
        i += 1  # 自增索引

    # 写回到文件中
    with open(file_path, "w") as f:
        f.writelines(lines)

    ###### 2. 替换 /path/to  为 zotero 所在的目录
    with open(file_path, "r") as f:
        content = f.read()
    content = content.replace("/path/to", zotero_path)
    # 写回到文件中
    with open(file_path, "w") as f:
        f.write(content)

    ##### 3. 处理 zotero.exe 的问题
    with open(file_path, 'r') as f:
        file_content = f.read()
    file_content = re.sub(r'zotero[0-9]{0,1}\.exe', 'zotero', file_content)
    with open(file_path, 'w') as f:
        f.write(file_content)
    ##### 4. 如果是 mac 则,杀死程序的时候,可以添加 killall zotero 
    # 即在,    "killZoteroUnix": "killall -9 zotero && kill -9 $(ps -x | grep zotero)",
    #
    
def get_zotero_config_dir() -> Path:
    """ 获取extensions文件夹 的路径"""
    home_dir = os.path.expanduser('~')
    # 使用 os.path.join() 函数连接文件夹路径
    if sys.platform.startswith('darwin'):
        home_dir = os.path.join(home_dir, 'Library','Application Support','Zotero', 'Profiles')
    elif sys.platform.startswith('win'):
        home_dir = os.path.join(home_dir, 'AppData','Roaming','Zotero', 'Zotero','Profiles')
    else:
        pass

    files = os.listdir(home_dir)
    # 遍历 Profiles 中的所有文件和文件夹, 
    for file in files:
        # 如果当前文件是文件夹，则进行进一步检查
        # 如果当前文件是文件夹，则进行进一步检查, 且 file 的文件名中包含 peizhi_name 字段
        if os.path.isdir(os.path.join(home_dir, file)) and (peizhi_name in file):
            home_dir = os.path.join(home_dir, file)
            break
    zotero_config_dir = home_dir
    return zotero_config_dir



def get_addon_id() -> str:
    """获取 package.json 中的 addonID 字段值"""
    with open('./package.json', 'r') as f:
        package_json = json.load(f)
    addon_id = package_json.get('config', {}).get('addonID')
    return addon_id


def create_addon_file(mkfile: Path) -> None:
    # 如果文件已经存在，先删除
    if os.path.exists(mkfile):
        send2trash.send2trash(mkfile)
    # 准备写入的内容
    text_content = os.path.join(os.getcwd(),'builds','addon')
    
    # 检查 mkfile 的上级目录是否存在, 不存在则创建
    parent_dir = os.path.dirname(mkfile)
    if not os.path.exists(parent_dir):
        os.makedirs(parent_dir)     # 创建目录
    # 把内容写入指定文件    
    with open(mkfile, 'w') as f:
        f.write(text_content)


def clean_prefs_js(zotero_config_dir: Path) -> None:
    # 读取 zotero_config_dir 下的prefs.js 
    # 打开文件并读取每一行
    with open(os.path.join(zotero_config_dir, 'prefs.js'), 'r') as f:
        lines = f.readlines()
    # 删除包含特定内容的行
    with open(os.path.join(zotero_config_dir, 'prefs.js'), 'w') as f:
        for line in lines:
            if 'extensions.lastAppBuildId' not in line and 'extensions.lastAppVersion' not in line:
                f.write(line)


if __name__ == '__main__':
    main()