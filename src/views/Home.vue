<template>
  <div class="container">
    <a-row :gutter="16">
      <a-col :span="8">
        <a-form layout="horizontal">
          <a-form-item label="连接" :label-col="{span:4}" :wrapper-col="{span:20}">
            <a-input placeholder="请输入ws连接" v-model.trim="url">
              <a-icon
                slot="addonAfter"
                type="check-circle"
                :title="isOpen ? '关闭连接':'发起连接'"
                theme="twoTone"
                :two-tone-color="isOpen ? '#52c41a':'#999'"
                @click="handleConnect"
              >
              </a-icon>
            </a-input>
          </a-form-item>
          <a-form-item label="消息" :label-col="{span:4}" :wrapper-col="{span:20}">
            <a-textarea :rows="20" :disabled="!isOpen" v-model="message"/>
          </a-form-item>
          <a-form-item label="模板" :label-col="{span:4}" :wrapper-col="{span:20}">
            <a-checkbox :disabled="!isOpen && message != null && message != ''" :checked="saveTemp" @change="changeSaveTemp">保存消息到模板库</a-checkbox>
          </a-form-item>
          <a-form-item label="心跳" :label-col="{span:4}" :wrapper-col="{span:20}">
            <a-switch checked-children="发送" un-checked-children="不发送" @change="handleChangHeart">发送心跳</a-switch>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="handleSend">
              发送
            </a-button>
            <a-button type="link" @click="handleShowJsonEdit">
              JSON编辑器
            </a-button>
            <a-button type="link" @click="handleSetHeart">
              设置心跳
            </a-button>
            <a-button type="link" @click="handlemsgTemp" :disabled="!isOpen">消息模板</a-button>
          </a-form-item>
        </a-form>
      </a-col>
      <a-col :span="8">
        <a-alert message="请求报文" type="info" style="margin-bottom:10px" />
        <div class="menu">
        <a-checkbox :checked="showReqTime" @change="toggleReqChecked">显示发送时间？</a-checkbox>
        <a-button type="link" size="small" @click="handleClear(1)" :disabled="!(reqData && reqData.length>0)">清空列表</a-button>
        </div>
        <div class="message-content mc-req" v-if="reqData && reqData.length>0">
          <div class="message-item" v-for="(item, i) in reqData" :key="i" >
            <div class="text">
              <a-popover>
                <template slot="content">{{item.msg}}</template>
                <span v-if="showReqTime" style="margin-right:5px;color:#e0e0e0;">{{item.time}} |</span>{{ item.msg }}
              </a-popover>
            </div>
            <a-icon type="codepen" class="json-btn" v-if="item.json" @click="showJSON(item.msg)"/>
          </div>
        </div>
        <a-empty v-else description="暂无请求数据" />
      </a-col>
      <a-col :span="8">
        <a-alert message="响应报文" type="success" style="margin-bottom:10px" />
        <div class="menu">
          <a-checkbox :checked="showRespTime" @change="toggleRespChecked">显示接收时间？</a-checkbox>
          <a-button type="link" size="small" @click="handleClear(2)" :disabled="!(respData && respData.length > 0)">清空列表</a-button>
        </div>
        <div class="message-content mc-resp" v-if="respData && respData.length > 0">
          <div class="message-item" v-for="(item, i) in respData" :key="i">
            <div class="text">
              <a-popover>
                <template slot="content">{{item.msg}}</template>
                <span v-if="showRespTime" style="margin-right:5px;color:#e0e0e0;">{{item.time}} |</span>{{ item.msg }}
              </a-popover>
            </div>
            <a-icon type="codepen" class="json-btn" v-if="item.json" @click="showJSON(item.msg)"/>
          </div>
        </div>
        <a-empty v-else description="暂无响应数据" />
        
      </a-col>
    </a-row>
    <!-- 展示-->
    <a-modal
      :visible="showJson"
      title="JSON可视化"
      :width="800"
      :footer="null"
      @cancel="handleCancel"
    >
    <div style="min-height:500px;overflow-y: auto;">
      <vue-json-editor
      v-model="jsonMessage" 
      :mode="'tree'"
      lang="zh" 
     ></vue-json-editor>
    </div>
    </a-modal>

    <!-- 编辑 -->
    <a-modal
    title="JSON编辑器"
      :visible="showJsonEdit"
      :width="800"
      @ok="handleEdit"
      @cancel="handleCancelEdit"
    >
    <div style="min-height:500px;overflow-y: auto;">
      <vue-json-editor
      v-model="jsonMessageEdit" 
      :mode="'code'"
      lang="zh" 
     ></vue-json-editor>
    </div>
    </a-modal>
    <!-- 心跳 -->
    <a-modal title="心跳设置" :visible="heartVisible" @ok="handleSaveHeart" @cancel="handleCancelHeart">
      <a-form layout="horizontal">
          <a-form-item label="心跳内容" :label-col="{span:4}" :wrapper-col="{span:20}">
            <a-textarea placeholder='请输入心跳内容，默认发送"PING"' v-model.trim="heartContent" />
          </a-form-item>
          <a-form-item label="时间间隔" :label-col="{span:4}" :wrapper-col="{span:20}">
            <a-input type="number" placeholder="请输入心跳间隔(毫秒),默认5000" v-model.trim="time" />
          </a-form-item>
      </a-form>
    </a-modal>
    <a-modal 
    title="消息模板" 
    :visible="tempVisible" 
    :width="900" 
    :footer="null"
    :bodyStyle="{position: 'relative'}" 
    @cancel="handleTempCancel">
      <div class="temp-content">
        <div class="temp-list" v-if="msgTemp && msgTemp.length>0">
          <div v-for="(item,i) in msgTemp" :key="i" :class="['list-item', message==item?'active':null]" @click="choiceTemp(item)">
            {{item}}
            <a-button type="danger" size="small" class="del-btn" @click="deleteTemp(item)">删除</a-button>
            </div>
        </div>
        <a-empty v-else description="暂无模板数据" />
      </div>
    </a-modal>
  </div>
</template>

<script>
import vueJsonEditor from 'vue-json-editor'
export default {
  components: {
      vueJsonEditor
  },
  data() {
    return {
      form: {},
      url: '',
      message: '',
      reqData: [],
      respData: [],
      ws: null,
      isOpen: false,
      showReqTime: false,
      showRespTime: false,
      showJson: false,
      showJsonEdit: false,
      heartVisible: false,
      tempVisible: false,
      sendHeart: false,
      saveTemp: false,
      jsonMessage: null,
      jsonMessageEdit: '',
      heartContent: '',
      showdelTip: false,
      timer: null,
      time: null,
      store: null,
      msgTemp: [],
      version:''
    };
  },
  mounted(){
    const remote = require('electron').remote;
    const app = remote.app;
    const Store = require('electron-store');
    this.store = new Store({
      cwd: app.getPath('userData')
    })
    if(this.store.get('url')){
      this.url = this.store.get('url')
    }
    if(this.store.get('heartContent')){
      this.heartContent = this.store.get('heartContent')
    }
    if(this.store.get('time')){
      this.time = this.store.get('time')
    }
    if(this.store.get('showReqTime')){
      this.showReqTime = this.store.get('showReqTime')
    }
    if(this.store.get('showRespTime')){
      this.showRespTime = this.store.get('showRespTime')
    }
    if(this.store.get('msgTemp')){
      this.msgTemp = this.store.get('msgTemp');
    }
    const pack = require("../../package.json");
    const version = pack.version;
    this.version = version
    //没有版本缓存，提示版本信息
    if(!this.store.get(`version${version}`)){
      const self = this;
      this.$info({
        title: '欢迎使用WebSocket测试工具',
        content: (
          <div>
            <p>版本：{version}</p>
            <p>作者：武汉软艺信息技术有限公司技术支持组</p>
            <p style="color:blue">更新内容：增加消息模板，优化细节</p>
          </div>
        ),
        onOk(){
          self.$destroyAll();
          self.store.set(`version${version}`,`version${version}`)
        }
      });
    }
  },
  methods: {
    handleSubmit: function() {},
    checkJson: function(str) {
      if (typeof str == 'string') {
        try {
          JSON.parse(str);
          return true;
        } catch (e) {
          console.log('error：' + str + '!!!' + e);
          return false;
        }
      }
    },
    showJSON:function(msg){
      this.jsonMessage = JSON.parse(msg);
      this.showJson  = true;
    },
    toggleReqChecked:function(){
      this.showReqTime = !this.showReqTime;
      this.store.set('showReqTime',this.showReqTime)
    },
    toggleRespChecked:function(){
      this.showRespTime = !this.showRespTime;
      this.store.set('showRespTime',this.showRespTime)
    },
    changeSaveTemp:function(){
      this.saveTemp = !this.saveTemp;
    },
    handleCancel:function(){
      this.showJson = false;
      this.jsonMessage = null;
    },
    handleClear:function(type){
      if(type == 1){
        this.reqData = [];
      }else if(type == 2){
        this.respData = [];
      }
    },
    handleShowJsonEdit(){
      this.showJsonEdit = true;
      if(this.checkJson(this.message)){
        this.jsonMessageEdit = JSON.parse(this.message)
      }
    },
    handleCancelEdit:function(){
      this.showJsonEdit = false;
    },
    handleEdit:function(){
      this.showJsonEdit = false;
      this.message = JSON.stringify(this.jsonMessageEdit);
    },
    handleSetHeart:function(){
      this.heartVisible = true;
    },
    handleCancelHeart:function(){
      this.heartVisible = false;
    },
    handleSaveHeart:function(){
      this.handleSendHeart();
      this.heartVisible = false;
      this.store.set('heartContent',this.heartContent)
      this.store.set('time',this.time)
    },
    handleChangHeart:function(checked){
      this.sendHeart = checked;
      if(checked){
        this.handleSendHeart();
      }else{
        if(this.timer != null){
          window.clearInterval(this.timer);
        }
      }
    },
    //模板弹框
    handlemsgTemp(){
      this.tempVisible = true;
    },
    handleTempCancel(){
      this.tempVisible = false;
    },
    //选择消息
    choiceTemp(obj){
      let e = window.event;
      e.stopPropagation()
      this.message = obj;
      this.tempVisible = false;
    },
    async deleteTemp(obj){
      let e = window.event;
      e.stopPropagation();
      let self = this;
      if(!this.showdelTip){
        this.$confirm({
          title: '确定删除此模板吗?',
          content: () => <a-checkbox checked={this.showdelTip} onChange={() =>this.changeDelTip()}><span style="color:red;">下次不再显示</span></a-checkbox>,
          onOk() {
            self.deleteTempEvent(obj)
          },
          onCancel() {
            console.log('Cancel');
          }
        });
      }else{
        self.deleteTempEvent(obj)
      }
      
    },
    deleteTempEvent(temp){
      let msgTemp = this.msgTemp;
      if(msgTemp.indexOf(temp) >= 0){
        msgTemp.splice(msgTemp.indexOf(temp),1)
      }
      this.msgTemp = msgTemp;
      this.store.set('msgTemp',msgTemp);
    },
    changeDelTip(){
      this.showdelTip = !this.showdelTip;
    },
    handleConnect:function(){
      if(this.isOpen){
        if(this.ws == null){
          this.$message.warning('未连接，关闭失败!');
          return;
        }
        this.ws.close();
      }else{
        if(this.url == '' ){
          this.$message.warning('连接不能为空');
          return;
        }
        this.store.set('url',this.url)
        try {
            this.ws = new WebSocket(this.url);
        }catch (error){
            this.$message.error("连接失败，请检查链接是否正确和服务是否正常");
            return;
        }
        this.ws.onerror = (error) =>{
          this.$message.error(error);
        }
        this.ws.onopen = () =>{
          this.$message.success('连接成功');
          this.isOpen = true;
        }

        //监听消息
        this.ws.onmessage = (evt) =>{
          let msg = evt.data;
          let json = false;
          if(this.checkJson(msg)){
            json = true;
          }
          this.respData.push({
              json,
              msg: msg,
              time: this.$moment(new Date()).format("YY/MM/DD HH:mm:ss")
            })
            //滚动条置底
            document.querySelector(".mc-resp").scrollTop = document.querySelector('.mc-resp').scrollHeight;
        }
        this.ws.onclose = ()=>{
          this.$message.warning('连接关闭！');
          this.isOpen = false;
        }
      }
    },
    //发送心跳
    handleSendHeart:function(){
      if(!this.isOpen){
        this.$message.warning('未连接，不允许发送心跳！');
        return
      }
      if(!this.sendHeart){
        return;
      }
      if(this.timer){
        window.clearInterval(this.timer);
      }
      this.timer = window.setInterval(()=>{
        this.ws.send(this.heartContent || "PING")
      },this.time||5000)
    },
    //发送消息
    handleSend:function(){
      if(!this.isOpen || this.ws == null){
        this.$message.warning('服务未连接,请连接后再发送');
        this.isOpen = false;
        return;
      }
      this.ws.send(this.message);
      this.reqData.push({
        json: this.checkJson(this.message),
        msg: this.message,
        time: this.$moment(new Date()).format("YY/MM/DD HH:mm:ss")
      })
      if(this.msgTemp.indexOf(this.message) < 0){
        this.msgTemp.splice(0,0,this.message);
      }
      this.store.set('msgTemp',this.msgTemp);
      //滚动条置底
      document.querySelector(".mc-req").scrollTop = document.querySelector('.mc-req').scrollHeight;
    }
  },
};
</script>
<style lang="scss" scoped>
.container {
  width: 100%;
  height: 100vh;
  padding: 20px;

  .message-content {
    height: 640px;
    overflow-y: auto;
    margin-bottom: 10px;

    &::-webkit-scrollbar-track {
      -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
      background-color: #f5f5f5;
      border-radius: 10px;
    }

    &::-webkit-scrollbar {
      width: 10px;
      background-color: #f5f5f5;
    }

    &::-webkit-scrollbar-thumb {
      background-color: #aaa;
      border-radius: 10px;
      background-image: -webkit-linear-gradient(
        90deg,
        rgba(0, 0, 0, 0.2) 25%,
        transparent 25%,
        transparent 50%,
        rgba(0, 0, 0, 0.2) 50%,
        rgba(0, 0, 0, 0.2) 75%,
        transparent 75%,
        transparent
      );
    }

    .message-item {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 4px;
      width: 100%;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      height: 34px;

      &:last-child{
        border: 1px solid red;
      }

      .text {
        width: calc(100% - 50px);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .json-btn {
        margin-top: 5px;
        cursor: pointer;
      }
    }
    
  }

  .menu {
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
  }
}

.temp-content{
  max-height: 500px;
  overflow-y: auto;
  position: relative;
  
  .temp-list{
    justify-content: space-between;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;

    & .list-item{
      margin: 5px 0;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 3px;
      width: calc(50% - 10px);
      position: relative;

      &.active{
        border: 1px solid blue;
      }
      & .del-btn {
        display: none;
        position: absolute;
        right: 3px;
        top: 3px;
      }

      &:hover .del-btn{
        display: block;
      }
    }
  }
}
</style>
