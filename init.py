import sys
import os
import platform
from pathlib import Path
import re
import shutil
import json
import send2trash
from collections import OrderedDict
from colorama import init, Fore, Back, Style
init()  # 初始化 colorama


######################## 准备工作 ########################

### python 的第三方包 -- jsonpath 可以处理嵌套的 json 
### 但是这里使用递归的方式来处理，是为了更好的理解 json 的结构, 且 这里的 json 本来就很简单
    
def find_key(data, target_key):
    """
    递归遍历字典/列表中的所有元素，查找目标键并返回对应的值。
    parm: data: 字典/列表, 
    parm: target_key: 目标键
    """
    if isinstance(data, dict):  # 如果 obj 是字典类型
        for key, value in data.items():
            if key == target_key:  # 如果当前键为 addonID，返回对应的值
                return value
            else:
                result = find_key(value, target_key)  # 否则继续递归查找
                if result:
                    return result
    elif isinstance(data, list):  # 如果 obj 是列表类型
        for item in data:
            result = find_key(item, target_key)  # 对列表中每个元素进行递归查询
            if result:
                return result
    elif isinstance(data, str):  # 如果 obj 是字符串类型
        return None
    else:
        raise TypeError("Unsupported type: {}".format(type(data)))  # 如果不是字典/列表/字符串，则报错
    return None  # 如果都没有找到，则返回 None



def find_key_and_replace(data, target_key, new_value):
    """
    递归遍历字典/列表中的所有元素，查找目标键并将其值替换为新值。
    parm: data: 字典/列表,
    parm: target_key: 目标键
    parm: new_value: 新值
    """
    if isinstance(data, dict):  # 如果当前元素是字典，则递归处理每个值。
        for key in data:
            if key == target_key:
                data[key] = new_value
            else:
                find_key_and_replace(data[key], target_key, new_value)
    elif isinstance(data, list):  # 如果当前元素是列表，则递归处理每个元素。
        for item in data:
            find_key_and_replace(item, target_key, new_value)


def modify_zotero_cmd_json(target_file: Path) -> None:
    """修改 zotero-cmd.json 文件 -- 根据操作系统调用不同的函数进行处理"""
    with open(target_file) as f:
        data = json.load(f)
    if sys.platform.startswith('win'):
        temp_path = str(Path(zotero_path).joinpath('zotero.exe'))
    elif sys.platform == 'darwin':
        temp_path = str(Path(zotero_path).joinpath('zotero'))
        find_key_and_replace(data, 'killZoteroUnix', "killall -9 zotero")
    else:
        raise ValueError('不支持的操作系统')
    
    data['startZotero'] = f"{temp_path} --debugger --purgecaches"  # 直接添加字段
    find_key_and_replace(data, '6', temp_path)
    find_key_and_replace(data, '7', temp_path)
    # 将修改后的结果写回到原始文件
    with open(target_file, 'w') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)




def get_zotero_config_dir() -> Path:
    """ 获取extensions文件夹 的路径"""
    if sys.platform.startswith('darwin'):
        home_dir = Path.joinpath(Path.home(), 'Library','Application Support','Zotero', 'Profiles')
    elif sys.platform.startswith('win'):
        home_dir = Path.joinpath(Path.home(), 'AppData','Roaming','Zotero', 'Zotero','Profiles')
    else:
        raise NotImplementedError('Only Windows and macOS are supported!')

    # 遍历 Profiles 中的所有文件和文件夹, 
    for file in home_dir.iterdir():
        # 如果当前文件是文件夹，则进行进一步检查, 且 file 的文件名中包含 peizhi_name 字段
        if file.is_dir() and (peizhi_name in file.name):
            home_dir = file
            break

    zotero_config_dir = home_dir
    return zotero_config_dir

# 从 package.json 中获取 指定字段,请写一个函数
def get_package_json_field(field_name: str) -> str:
    """获取 package.json 中的指定字段的值"""
    with open('./package.json', 'r') as f:
        package_json = json.load(f)
    field_value = find_key(package_json, field_name)
    #判断是否存在 field_value
    if field_value is None:
        raise Exception(f'package.json 中未找到 {field_name} 字段')
    if not isinstance(field_value, str):
        raise Exception(f'package.json 中 {field_name} 字段不是字符串')
    if len(field_value) == 0:
        raise Exception(f'package.json 中 {field_name} 字段是空字符串')
    return field_value


def create_addon_file(mkfile: Path) -> None:
    """
    创建 mkfile 文件, 并切入当工作目录中的插件路径,
    """
    # 如果文件已经存在，先删除
    if mkfile.exists():
        mkfile.unlink()
        
    # 准备写入的内容
    text_content = str(Path(os.getcwd(), 'builds', 'addon'))

    # 检查 mkfile 的上级目录是否存在, 不存在则创建
    mkfile.parent.mkdir(parents=True, exist_ok=True)

    # 把内容写入指定文件    
    with open(mkfile, 'w') as f:
        try:
            f.write(text_content)
        except IOError as e:
            print(f'Error writing to {mkfile}: {e}')



def clean_prefs_js(zotero_config_dir: Path) -> None:
    """
    清理 prefs.js 文件中的特定内容
    """
    prefs_file = Path.joinpath(zotero_config_dir, 'prefs.js')
    # 如果文件不存在, 则报错
    if not prefs_file.exists():
        raise Exception(f'文件 {prefs_file} 不存在')
    
    # 读取 prefs.js 文件中的内容,
    with prefs_file.open('r') as f:
        lines = f.readlines()
        
    # 删除包含特定内容的行
    with prefs_file.open('w') as f:
        for line in lines:
            if 'extensions.lastAppBuildId' not in line and 'extensions.lastAppVersion' not in line:
                f.write(line)





def clean_this_plugin_prefs(zotero_config_dir: Path,  addonRef = 'addonRef') -> None:
    """
    清理 prefs.js 文件中的特定内容, 以及特定字段
    parm: zotero_config_dir: zotero 配置文件夹的路径
    parm: addonRef: 需要清理的字段, 这个字段在 ./package.json 中, 表示插件的 addonRef, 
    addonRef 字段表示插件的名字, 用于注册信息用的
    """
    # 生成 prefs.js 文件的路径
    prefs_file = Path.joinpath(zotero_config_dir, 'prefs.js')
    # 如果文件不存在, 则报错
    if not prefs_file.exists():
        raise Exception(f'文件 {prefs_file} 不存在')
    
    # 读取 package.json 中的 addonRef 字段值 
    addonRef = get_package_json_field(addonRef)

    # 再次读取 prefs.js 文件中的内容,
    with prefs_file.open('r', encoding='utf-8') as file:
        lines = file.readlines()

    # 处理包含特定字符 str_a 和 str_b 的行
    str_a = 'user_pref' # str_a 表示需要被删除的行
    str_b = 'zotero.' + addonRef # str_b 表示需要被删除的行

    # 清楚配置文件中同时带有以下关键字的行:
    print(f'\n\n===== 正在删除如下文件中的同时包含 {str_a} 和 {str_b}  的行 ======')
    print(f'{prefs_file}')
    processed_lines = []
    for line in lines:
        # If line contains both str_a and str_b, skip it
        if str_a in line and str_b in line:
            continue
        processed_lines.append(line)

    # 前后对比,删除了多少行
    print(f'==== 共删除了 {len(lines) - len(processed_lines)} 行')

    # 将处理后的内容写回源文件
    with prefs_file.open('w', encoding='utf-8') as file:
        file.writelines(processed_lines)














#######################################################################################
#######################################################################################
#######################################################################################

##### 0. 初始值的设定 ###############################################################
peizhi_name =  "Default" # 'testmy' # 选择你要配置的那个名字, 建议先创建一个mytest 账号的配置文件, 
# 命令行 运行 /Applications/Zotero.app/Contents/MacOS/zotero -P  即可创建配置文件, 
# 默认的配置文件为 default, 你可以在配置文件中修改配置文件的名字,
# 可以在苹果系统使用 killall 来杀死进程   killall -9 zotero 

isclearPrefs = True # 是否清理 prefs.js 文件中的特定内容, 即包括:  zotero.插件名字 

if sys.platform.startswith('win'):
    # zotero 软件的目录.即 zotero.exe所在的目录(win )
    zotero_path = r'C:\kk\Zotero'                  
elif sys.platform.startswith('darwin'):
     # mac 中zotero 软件的目录
    zotero_path = r'/Applications/Zotero.app/Contents/MacOS/'
else:
    raise Exception('当前系统不支持')


# 获取当前文件所在的目录
# 把 init.py 的路径转换为绝对路径, 然后获取其父目录, 即为当前文件所在的目录
root_dir = Path(__file__).resolve().parent # 需要把这个文件放在 package.json 同级目录下
os.chdir(root_dir) 

# 检查当前目录下是否存在 .package.json 文件
if not Path('./package.json').exists():
    print(f'当前目录下不存在 package.json 文件, 请检查是否放置在正确的目录下')
    exit(1)

# 输出当前工作路径
print(Back.LIGHTBLACK_EX + f"========= 当前工作目录为: ==========" )
print(f"{Path.cwd()} \n")

######### 1. 复制  zotero-cmd.json   ########################
source_file = Path('./scripts/zotero-cmd-default.json') # 这个地址可能需要更改
target_file = Path('./scripts/zotero-cmd.json') 
shutil.copy(source_file,target_file) # 使用 copy() 函数复制文件



####### 2. 对  zotero-cmd.json 的内容进行修改
modify_zotero_cmd_json(target_file)

####### 3. 获取extensions文件夹的路径
zotero_config_dir = get_zotero_config_dir() 
zotero_config_dir_extensions = zotero_config_dir.joinpath('extensions')

print(f"=====zotero的配置目录: ===========\n{zotero_config_dir}\n")
print(f"=====extensions文件夹的路径: ======\n{zotero_config_dir_extensions}\n")

###### 4. 在 extensions 文件夹中创建一个以  package.json 中的 addonID字段值 为名的文件, 
# （例如，myplugin@mydomain.org，此处应与package.json中的addonID一致). 
#  该文件的内容为  是插件编译后的源代码绝对路径（例如，插件路径/builds/addon）。
#### 4.1 获取 package.json 中的 addonID字段值, 利用递归查找
addon_id = get_package_json_field('addonID')

mkfile = Path.joinpath(zotero_config_dir_extensions, addon_id)  # 生成要创建的路径
create_addon_file(mkfile) # 创建文件并写入内容
print('=====创建的文件路径: ====\n '+ str(mkfile))

# 4. 返回上一级（Zotero配置文件目录），打开prefs.js，并删除包含extensions.lastAppBuildId 和extensions.lastAppVersion的行。
clean_prefs_js(zotero_config_dir)



# 5. 清楚 prefs.js 文件中的特定内容,即残留在 zotero 中的插件信息, 比如 zotero.  和  user_pref
if isclearPrefs:
    clean_this_plugin_prefs(zotero_config_dir)

print(Style.RESET_ALL)


