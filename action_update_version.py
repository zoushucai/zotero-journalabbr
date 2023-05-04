import os
from pathlib import Path
import json
import sys


print(f"------ Python 版本: {sys.version} --------" )

new_tag = sys.argv[1]
print(f"当前的版本号为: {new_tag}")

# 打印当前工作目录
print("当前的工作目录为:" + os.getcwd())


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



def modify_package_json(target_file: Path) -> None:
    """修改 package-cmd.json 文件 -- 根据操作系统调用不同的函数进行处理"""
    with open(target_file) as f:
        data = json.load(f)
    # 修改版本号
    find_key_and_replace(data, 'version', new_tag)

    # 将修改后的结果写回到原始文件
    with open(target_file, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')

modify_package_json(Path('package.json'))

print("修改版本号成功！")