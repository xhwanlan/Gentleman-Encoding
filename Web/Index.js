const { createApp } = Vue
const binaryZero = '00000000'
const binaryZeroLength = binaryZero.length
const powersOfTwoSet = [2, 4, 8, 16, 32, 64, 128, 256]
const dataKey = "Data"
const defaultItemCount = 1
const ruleFileName = "Gentleman Encoding Rule.json"

createApp({
    data() {
        return {
            inputText: '',
            result: '',
            charSet: '',
            bitCount: 0,
            xorCode: 0,
            items: [{ title: "君子八雅", charSet: "琴棋书画诗酒花茶", xorCode: 0, select: true, canDelete: false }],

            newRuleDialog: null,
            isDeleteRule: false,

            newRuleSetNum: powersOfTwoSet[1],
            newRuleCharSet: "",
            newRuleXorCode: 0,
            newRuleTitle: ""
        }
    },
    methods: {
        Encode() {
            if (window.TextEncoder !== undefined) {
                let strArray = []
                let encoder = new TextEncoder()
                encoder.encode(this.inputText).forEach(value => {
                    var bits = `${binaryZero}${(value ^ this.xorCode).toString(2)}`.slice(-binaryZeroLength)
                    strArray.push(bits)
                })
                let len = strArray.join('').length % this.bitCount
                if (len > 0) {
                    len = this.bitCount - len
                    while (len--) {
                        strArray.push('0')
                    }
                }
                let str = strArray.join('')
                strArray.length = 0
                for (let i = 0; i < str.length - 1; i += this.bitCount) {
                    strArray.push(this.charSet[parseInt(str.substring(i, i + this.bitCount), 2)])
                }
                this.result = strArray.join('')
            } else {
                mdui.alert('该浏览器不支持该功能')
            }
        },
        Decode() {
            if (window.TextDecoder !== undefined) {
                let strArray = []
                let zeroStr = binaryZero.slice(-this.bitCount)
                for (let value of this.inputText) {
                    var index = this.charSet.indexOf(value)
                    if (index < 0 || index >= this.charSet.length) {
                        mdui.alert('输入文本内含有字符集以外的文本')
                        return
                    }
                    var bits = `${zeroStr}${(index).toString(2)}`.slice(-this.bitCount)
                    strArray.push(bits)
                }
                let str = strArray.join('')
                str = str.substring(0, str.length - str.length % binaryZeroLength)
                strArray.length = 0
                for (let i = 0; i < str.length - 1; i += binaryZeroLength) {
                    strArray.push(parseInt(str.substring(i, i + binaryZeroLength), 2) ^ this.xorCode)
                }
                let decoder = new TextDecoder()
                this.result = decoder.decode(new Uint8Array(strArray))
            } else {
                mdui.alert('该浏览器不支持该功能')
            }
        },
        OnInputXorCode(event) {
            let value = event.target.value
            if (value < 0) {
                value = 0
            } else if (value > 255) {
                value = 255
            }
            this.xorCode = value
        },
        OnClickItem(index) {
            if (!this.isDeleteRule) {
                this.items.forEach((item, i) => {
                    item.selected = i === index
                    if (item.selected) {
                        this.xorCode = item.xorCode
                        this.charSet = item.charSet
                        this.bitCount = powersOfTwoSet.indexOf(item.charSet.length) + 1
                    }
                })
            }
        },
        async Copy() {
            let clipboard = navigator.clipboard
            if (clipboard == undefined) {
                mdui.snackbar({
                    message: '浏览器不支持复制',
                    position: 'top'
                })
            } else {
                await clipboard.writeText(this.result)
                mdui.snackbar({
                    message: '复制成功',
                    position: 'top',
                })
            }
        },
        SaveRule() {
            let blob = new Blob([GetDataString()], { type: "application/json;charset=utf-8" });

            let urlObject = window.URL || window.webkitURL || window
            let url = urlObject.createObjectURL(blob)

            let eleLink = document.createElement('a')
            eleLink.download = ruleFileName
            eleLink.style.display = 'none'
            eleLink.href = url
            document.body.appendChild(eleLink)
            eleLink.click()
            document.body.removeChild(eleLink)
        },
        OnClickLoadButton() {
            this.$refs.file.click()
        },
        LoadRule() {
            let _this = this

            let file = _this.$refs.file.files[0]
            var reader = new FileReader()
            reader.readAsText(file)
            reader.onload = function () {
                let json = JSON.parse(this.result)
                SetDataString(this.result)

                let i = defaultItemCount
                for (let item of json) {
                    _this.items[i] = item
                    i++
                }
                _this.$refs.file.value = ''
                _this.items.length = i
            }

        },
        NewRuleDialog() {
            this.newRuleDialog.open()
        },
        DeleteRuleToggle() {
            this.isDeleteRule = !this.isDeleteRule
        },
        DeleteRule(index) {
            if (this.isDeleteRule) {
                let json = GetData()
                this.items.splice(index, 1)
                if (index >= defaultItemCount && index - defaultItemCount < json.length) {
                    json.splice(index - defaultItemCount, 1)
                    SetDataString(JSON.stringify(json))
                }
            }
        },
        AddNewRule() {
            if (this.newRuleCharSet.length == this.newRuleSetNum) {
                for (let i = 0; i < this.newRuleCharSet.length; i++) {
                    let lastIndex = this.newRuleCharSet.lastIndexOf(this.newRuleCharSet[i])

                    if (lastIndex != i) {
                        mdui.alert(`字符集中 "${this.newRuleCharSet[i]}" 有重复`)
                        return
                    }
                }

                if (this.newRuleXorCode < 0) {
                    this.newRuleXorCode = 0
                } else if (this.newRuleXorCode > 255) {
                    this.newRuleXorCode = 255
                }
                let title = this.newRuleTitle
                if (title.length == 0) {
                    title = this.newRuleCharSet
                }

                let item = {
                    title: title, charSet: this.newRuleCharSet, xorCode: this.newRuleXorCode, selected: false, canDelete: true
                }
                this.items.push(item)

                let json = GetData()
                json.push(item)
                SetDataString(JSON.stringify(json))

            } else {
                mdui.alert("字符集长度不符合要求")
            }
        }
    },
    watch: {
        newRuleSetNum: {
            handler() {
                mdui.updateTextFields()
            },
            flush: 'post'
        }
    },
    computed: {
        Str: {
            get() {
                for (const item of this.items) {
                    if (item.selected) {
                        return item.charSet
                    }
                }
            }
        }
    },
    mounted() {
        let json = GetData()
        for (const item of json) {
            this.items.push(item)
        }

        this.OnClickItem(0)
        this.newRuleDialog = new mdui.Dialog('#new-rule')
    }
}).mount('#app')

function GetData() {
    let json = JSON.parse(GetDataString())
    if (json == null) {
        json = []
    }
    return json
}

function GetDataString() {
    return localStorage.getItem(dataKey)
}

function SetDataString(string) {
    localStorage.setItem(dataKey, string)
}