import{n as c,c as W,a as M,r as O,i as U,o as j,b as u,d as _e,U as pe,e as $n,f as Rn,g as In}from"./index-GrYnjlUQ.js";import{A as ti,i as q,e as Q,r as K,a as V,b as E,C as D,c as N,O as Ce,d as L,E as ne,R as F,f as tt,g as Y,h as z,S as wt,j as En,W as li,k as xi,T as ii,l as it,M as rn,m as De,w as Me,n as Ci,o as _n}from"./adapter-CGDu3FZx.js";import{z as Sn,q as Wn}from"./index-DF7V25I4.js";import{r as Tn}from"./index-C6JYxlrI.js";import"./OsmosisSwap-CAnbTqbN.js";import"./index-ttMMrHjh.js";/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function an(r){return c({...r,state:!0,attribute:!1})}/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ge=r=>r??ti,Pn=q`
  :host {
    position: relative;
    background-color: var(--wui-color-gray-glass-002);
    display: flex;
    justify-content: center;
    align-items: center;
    width: var(--local-size);
    height: var(--local-size);
    border-radius: inherit;
    border-radius: var(--local-border-radius);
  }

  :host > wui-flex {
    overflow: hidden;
    border-radius: inherit;
    border-radius: var(--local-border-radius);
  }

  :host::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: inherit;
    border: 1px solid var(--wui-color-gray-glass-010);
    pointer-events: none;
  }

  :host([name='Extension'])::after {
    border: 1px solid var(--wui-color-accent-glass-010);
  }

  :host([data-wallet-icon='allWallets']) {
    background-color: var(--wui-all-wallets-bg-100);
  }

  :host([data-wallet-icon='allWallets'])::after {
    border: 1px solid var(--wui-color-accent-glass-010);
  }

  wui-icon[data-parent-size='inherit'] {
    width: 75%;
    height: 75%;
    align-items: center;
  }

  wui-icon[data-parent-size='sm'] {
    width: 18px;
    height: 18px;
  }

  wui-icon[data-parent-size='md'] {
    width: 24px;
    height: 24px;
  }

  wui-icon[data-parent-size='lg'] {
    width: 42px;
    height: 42px;
  }

  wui-icon[data-parent-size='full'] {
    width: 100%;
    height: 100%;
  }

  :host > wui-icon-box {
    position: absolute;
    overflow: hidden;
    right: -1px;
    bottom: -2px;
    z-index: 1;
    border: 2px solid var(--wui-color-bg-150, #1e1f1f);
    padding: 1px;
  }
`;var Se=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let we=class extends V{constructor(){super(...arguments),this.size="md",this.name="",this.installed=!1,this.badgeSize="xs"}render(){let e="xxs";return this.size==="lg"?e="m":this.size==="md"?e="xs":e="xxs",this.style.cssText=`
       --local-border-radius: var(--wui-border-radius-${e});
       --local-size: var(--wui-wallet-image-size-${this.size});
   `,this.walletIcon&&(this.dataset.walletIcon=this.walletIcon),E`
      <wui-flex justifyContent="center" alignItems="center"> ${this.templateVisual()} </wui-flex>
    `}templateVisual(){return this.imageSrc?E`<wui-image src=${this.imageSrc} alt=${this.name}></wui-image>`:this.walletIcon?E`<wui-icon
        data-parent-size="md"
        size="md"
        color="inherit"
        name=${this.walletIcon}
      ></wui-icon>`:E`<wui-icon
      data-parent-size=${this.size}
      size="inherit"
      color="inherit"
      name="walletPlaceholder"
    ></wui-icon>`}};we.styles=[Q,K,Pn];Se([c()],we.prototype,"size",void 0);Se([c()],we.prototype,"name",void 0);Se([c()],we.prototype,"imageSrc",void 0);Se([c()],we.prototype,"walletIcon",void 0);Se([c({type:Boolean})],we.prototype,"installed",void 0);Se([c()],we.prototype,"badgeSize",void 0);we=Se([W("wui-wallet-image")],we);const Bn=q`
  :host {
    position: relative;
    border-radius: var(--wui-border-radius-xxs);
    width: 40px;
    height: 40px;
    overflow: hidden;
    background: var(--wui-color-gray-glass-002);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--wui-spacing-4xs);
    padding: 3.75px !important;
  }

  :host::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: inherit;
    border: 1px solid var(--wui-color-gray-glass-010);
    pointer-events: none;
  }

  :host > wui-wallet-image {
    width: 14px;
    height: 14px;
    border-radius: var(--wui-border-radius-5xs);
  }

  :host > wui-flex {
    padding: 2px;
    position: fixed;
    overflow: hidden;
    left: 34px;
    bottom: 8px;
    background: var(--dark-background-150, #1e1f1f);
    border-radius: 50%;
    z-index: 2;
    display: flex;
  }
`;var sn=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};const Tt=4;let nt=class extends V{constructor(){super(...arguments),this.walletImages=[]}render(){const e=this.walletImages.length<Tt;return E`${this.walletImages.slice(0,Tt).map(({src:i,walletName:n})=>E`
            <wui-wallet-image
              size="inherit"
              imageSrc=${i}
              name=${ge(n)}
            ></wui-wallet-image>
          `)}
      ${e?[...Array(Tt-this.walletImages.length)].map(()=>E` <wui-wallet-image size="inherit" name=""></wui-wallet-image>`):null}
      <wui-flex>
        <wui-icon-box
          size="xxs"
          iconSize="xxs"
          iconcolor="success-100"
          backgroundcolor="success-100"
          icon="checkmark"
          background="opaque"
        ></wui-icon-box>
      </wui-flex>`}};nt.styles=[K,Bn];sn([c({type:Array})],nt.prototype,"walletImages",void 0);nt=sn([W("wui-all-wallets-image")],nt);const Ln=q`
  button {
    column-gap: var(--wui-spacing-s);
    padding: 7px var(--wui-spacing-l) 7px var(--wui-spacing-xs);
    width: 100%;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
    color: var(--wui-color-fg-100);
  }

  button > wui-text:nth-child(2) {
    display: flex;
    flex: 1;
  }

  button:disabled {
    background-color: var(--wui-color-gray-glass-015);
    color: var(--wui-color-gray-glass-015);
  }

  button:disabled > wui-tag {
    background-color: var(--wui-color-gray-glass-010);
    color: var(--wui-color-fg-300);
  }

  wui-icon {
    color: var(--wui-color-fg-200) !important;
  }
`;var X=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let G=class extends V{constructor(){super(...arguments),this.walletImages=[],this.imageSrc="",this.name="",this.tabIdx=void 0,this.installed=!1,this.disabled=!1,this.showAllWallets=!1,this.loading=!1,this.loadingSpinnerColor="accent-100"}render(){return E`
      <button ?disabled=${this.disabled} tabindex=${ge(this.tabIdx)}>
        ${this.templateAllWallets()} ${this.templateWalletImage()}
        <wui-text variant="paragraph-500" color="inherit">${this.name}</wui-text>
        ${this.templateStatus()}
      </button>
    `}templateAllWallets(){return this.showAllWallets&&this.imageSrc?E` <wui-all-wallets-image .imageeSrc=${this.imageSrc}> </wui-all-wallets-image> `:this.showAllWallets&&this.walletIcon?E` <wui-wallet-image .walletIcon=${this.walletIcon} size="sm"> </wui-wallet-image> `:null}templateWalletImage(){return!this.showAllWallets&&this.imageSrc?E`<wui-wallet-image
        size="sm"
        imageSrc=${this.imageSrc}
        name=${this.name}
        .installed=${this.installed}
      ></wui-wallet-image>`:!this.showAllWallets&&!this.imageSrc?E`<wui-wallet-image size="sm" name=${this.name}></wui-wallet-image>`:null}templateStatus(){return this.loading?E`<wui-loading-spinner
        size="lg"
        color=${this.loadingSpinnerColor}
      ></wui-loading-spinner>`:this.tagLabel&&this.tagVariant?E`<wui-tag variant=${this.tagVariant}>${this.tagLabel}</wui-tag>`:this.icon?E`<wui-icon color="inherit" size="sm" name=${this.icon}></wui-icon>`:null}};G.styles=[K,Q,Ln];X([c({type:Array})],G.prototype,"walletImages",void 0);X([c()],G.prototype,"imageSrc",void 0);X([c()],G.prototype,"name",void 0);X([c()],G.prototype,"tagLabel",void 0);X([c()],G.prototype,"tagVariant",void 0);X([c()],G.prototype,"icon",void 0);X([c()],G.prototype,"walletIcon",void 0);X([c()],G.prototype,"tabIdx",void 0);X([c({type:Boolean})],G.prototype,"installed",void 0);X([c({type:Boolean})],G.prototype,"disabled",void 0);X([c({type:Boolean})],G.prototype,"showAllWallets",void 0);X([c({type:Boolean})],G.prototype,"loading",void 0);X([c({type:String})],G.prototype,"loadingSpinnerColor",void 0);G=X([W("wui-list-wallet")],G);var Ge=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let Oe=class extends U{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=D.state.connectors,this.count=N.state.count,this.isFetchingRecommendedWallets=N.state.isFetchingRecommendedWallets,this.unsubscribe.push(D.subscribeKey("connectors",e=>this.connectors=e),N.subscribeKey("count",e=>this.count=e),N.subscribeKey("isFetchingRecommendedWallets",e=>this.isFetchingRecommendedWallets=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.connectors.find(s=>s.id==="walletConnect"),{allWallets:i}=Ce.state;if(!e||i==="HIDE"||i==="ONLY_MOBILE"&&!L.isMobile())return null;const n=N.state.featured.length,o=this.count+n,t=o<10?o:Math.floor(o/10)*10,a=t<o?`${t}+`:`${t}`;return u`
      <wui-list-wallet
        name="All Wallets"
        walletIcon="allWallets"
        showAllWallets
        @click=${this.onAllWallets.bind(this)}
        tagLabel=${a}
        tagVariant="shade"
        data-testid="all-wallets"
        tabIdx=${j(this.tabIdx)}
        .loading=${this.isFetchingRecommendedWallets}
        loadingSpinnerColor=${this.isFetchingRecommendedWallets?"fg-300":"accent-100"}
      ></wui-list-wallet>
    `}onAllWallets(){ne.sendEvent({type:"track",event:"CLICK_ALL_WALLETS"}),F.push("AllWallets")}};Ge([M()],Oe.prototype,"tabIdx",void 0);Ge([O()],Oe.prototype,"connectors",void 0);Ge([O()],Oe.prototype,"count",void 0);Ge([O()],Oe.prototype,"isFetchingRecommendedWallets",void 0);Oe=Ge([W("w3m-all-wallets-widget")],Oe);var ci=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let ot=class extends U{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=D.state.connectors,this.unsubscribe.push(D.subscribeKey("connectors",e=>this.connectors=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.connectors.filter(i=>i.type==="ANNOUNCED");return e!=null&&e.length?u`
      <wui-flex flexDirection="column" gap="xs">
        ${e.filter(tt.showConnector).map(i=>u`
              <wui-list-wallet
                imageSrc=${j(Y.getConnectorImage(i))}
                name=${i.name??"Unknown"}
                @click=${()=>this.onConnector(i)}
                tagVariant="success"
                tagLabel="installed"
                data-testid=${`wallet-selector-${i.id}`}
                .installed=${!0}
                tabIdx=${j(this.tabIdx)}
              >
              </wui-list-wallet>
            `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnector(e){e.id==="walletConnect"?L.isMobile()?F.push("AllWallets"):F.push("ConnectingWalletConnect"):F.push("ConnectingExternal",{connector:e})}};ci([M()],ot.prototype,"tabIdx",void 0);ci([O()],ot.prototype,"connectors",void 0);ot=ci([W("w3m-connect-announced-widget")],ot);var bt=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let Ue=class extends U{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=D.state.connectors,this.loading=!1,this.unsubscribe.push(D.subscribeKey("connectors",e=>this.connectors=e)),L.isTelegram()&&L.isIos()&&(this.loading=!z.state.wcUri,this.unsubscribe.push(z.subscribeKey("wcUri",e=>this.loading=!e)))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const{customWallets:e}=Ce.state;if(!(e!=null&&e.length))return this.style.cssText="display: none",null;const i=this.filterOutDuplicateWallets(e);return u`<wui-flex flexDirection="column" gap="xs">
      ${i.map(n=>u`
          <wui-list-wallet
            imageSrc=${j(Y.getWalletImage(n))}
            name=${n.name??"Unknown"}
            @click=${()=>this.onConnectWallet(n)}
            data-testid=${`wallet-selector-${n.id}`}
            tabIdx=${j(this.tabIdx)}
            ?loading=${this.loading}
          >
          </wui-list-wallet>
        `)}
    </wui-flex>`}filterOutDuplicateWallets(e){const i=wt.getRecentWallets(),n=this.connectors.map(s=>{var l;return(l=s.info)==null?void 0:l.rdns}).filter(Boolean),o=i.map(s=>s.rdns).filter(Boolean),t=n.concat(o);if(t.includes("io.metamask.mobile")&&L.isMobile()){const s=t.indexOf("io.metamask.mobile");t[s]="io.metamask"}return e.filter(s=>!t.includes(String(s==null?void 0:s.rdns)))}onConnectWallet(e){this.loading||F.push("ConnectingWalletConnect",{wallet:e})}};bt([M()],Ue.prototype,"tabIdx",void 0);bt([O()],Ue.prototype,"connectors",void 0);bt([O()],Ue.prototype,"loading",void 0);Ue=bt([W("w3m-connect-custom-widget")],Ue);var ui=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let rt=class extends U{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=D.state.connectors,this.unsubscribe.push(D.subscribeKey("connectors",e=>this.connectors=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const i=this.connectors.filter(n=>n.type==="EXTERNAL").filter(n=>n.id!==En.CONNECTOR_ID.COINBASE_SDK);return i!=null&&i.length?u`
      <wui-flex flexDirection="column" gap="xs">
        ${i.map(n=>u`
            <wui-list-wallet
              imageSrc=${j(Y.getConnectorImage(n))}
              .installed=${!0}
              name=${n.name??"Unknown"}
              data-testid=${`wallet-selector-external-${n.id}`}
              @click=${()=>this.onConnector(n)}
              tabIdx=${j(this.tabIdx)}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnector(e){F.push("ConnectingExternal",{connector:e})}};ui([M()],rt.prototype,"tabIdx",void 0);ui([O()],rt.prototype,"connectors",void 0);rt=ui([W("w3m-connect-external-widget")],rt);var di=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let at=class extends U{constructor(){super(...arguments),this.tabIdx=void 0,this.wallets=[]}render(){return this.wallets.length?u`
      <wui-flex flexDirection="column" gap="xs">
        ${this.wallets.map(e=>u`
            <wui-list-wallet
              data-testid=${`wallet-selector-featured-${e.id}`}
              imageSrc=${j(Y.getWalletImage(e))}
              name=${e.name??"Unknown"}
              @click=${()=>this.onConnectWallet(e)}
              tabIdx=${j(this.tabIdx)}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnectWallet(e){D.selectWalletConnector(e)}};di([M()],at.prototype,"tabIdx",void 0);di([M()],at.prototype,"wallets",void 0);at=di([W("w3m-connect-featured-widget")],at);var hi=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let st=class extends U{constructor(){super(...arguments),this.tabIdx=void 0,this.connectors=[]}render(){var i;const e=this.connectors;return!(e!=null&&e.length)||e.length===1&&((i=e[0])==null?void 0:i.name)==="Browser Wallet"&&!L.isMobile()?(this.style.cssText="display: none",null):u`
      <wui-flex flexDirection="column" gap="xs">
        ${e.map(n=>{var t;const o=(t=n.info)==null?void 0:t.rdns;return!L.isMobile()&&n.name==="Browser Wallet"?null:!o&&!z.checkInstalled()?(this.style.cssText="display: none",null):tt.showConnector(n)?u`
            <wui-list-wallet
              imageSrc=${j(Y.getConnectorImage(n))}
              .installed=${!0}
              name=${n.name??"Unknown"}
              tagVariant="success"
              tagLabel="installed"
              data-testid=${`wallet-selector-${n.id}`}
              @click=${()=>this.onConnector(n)}
              tabIdx=${j(this.tabIdx)}
            >
            </wui-list-wallet>
          `:null})}
      </wui-flex>
    `}onConnector(e){D.setActiveConnector(e),F.push("ConnectingExternal",{connector:e})}};hi([M()],st.prototype,"tabIdx",void 0);hi([M()],st.prototype,"connectors",void 0);st=hi([W("w3m-connect-injected-widget")],st);var fi=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let lt=class extends U{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=D.state.connectors,this.unsubscribe.push(D.subscribeKey("connectors",e=>this.connectors=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.connectors.filter(i=>i.type==="MULTI_CHAIN"&&i.name!=="WalletConnect");return e!=null&&e.length?u`
      <wui-flex flexDirection="column" gap="xs">
        ${e.map(i=>u`
            <wui-list-wallet
              imageSrc=${j(Y.getConnectorImage(i))}
              .installed=${!0}
              name=${i.name??"Unknown"}
              tagVariant="shade"
              tagLabel="multichain"
              data-testid=${`wallet-selector-${i.id}`}
              @click=${()=>this.onConnector(i)}
              tabIdx=${j(this.tabIdx)}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnector(e){D.setActiveConnector(e),F.push("ConnectingMultiChain")}};fi([M()],lt.prototype,"tabIdx",void 0);fi([O()],lt.prototype,"connectors",void 0);lt=fi([W("w3m-connect-multi-chain-widget")],lt);var mt=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let qe=class extends U{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=D.state.connectors,this.loading=!1,this.unsubscribe.push(D.subscribeKey("connectors",e=>this.connectors=e)),L.isTelegram()&&L.isIos()&&(this.loading=!z.state.wcUri,this.unsubscribe.push(z.subscribeKey("wcUri",e=>this.loading=!e)))}render(){const i=wt.getRecentWallets().filter(n=>!this.connectors.some(o=>o.id===n.id||o.name===n.name));return i.length?u`
      <wui-flex flexDirection="column" gap="xs">
        ${i.map(n=>u`
            <wui-list-wallet
              imageSrc=${j(Y.getWalletImage(n))}
              name=${n.name??"Unknown"}
              @click=${()=>this.onConnectWallet(n)}
              tagLabel="recent"
              tagVariant="shade"
              tabIdx=${j(this.tabIdx)}
              ?loading=${this.loading}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnectWallet(e){this.loading||D.selectWalletConnector(e)}};mt([M()],qe.prototype,"tabIdx",void 0);mt([O()],qe.prototype,"connectors",void 0);mt([O()],qe.prototype,"loading",void 0);qe=mt([W("w3m-connect-recent-widget")],qe);var vt=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let Ve=class extends U{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.wallets=[],this.loading=!1,L.isTelegram()&&L.isIos()&&(this.loading=!z.state.wcUri,this.unsubscribe.push(z.subscribeKey("wcUri",e=>this.loading=!e)))}render(){const{connectors:e}=D.state,{customWallets:i,featuredWalletIds:n}=Ce.state,o=wt.getRecentWallets(),t=e.find(g=>g.id==="walletConnect"),s=e.filter(g=>g.type==="INJECTED"||g.type==="ANNOUNCED"||g.type==="MULTI_CHAIN").filter(g=>g.name!=="Browser Wallet");if(!t)return null;if(n||i||!this.wallets.length)return this.style.cssText="display: none",null;const l=s.length+o.length,d=Math.max(0,2-l),p=li.filterOutDuplicateWallets(this.wallets).slice(0,d);return p.length?u`
      <wui-flex flexDirection="column" gap="xs">
        ${p.map(g=>u`
            <wui-list-wallet
              imageSrc=${j(Y.getWalletImage(g))}
              name=${(g==null?void 0:g.name)??"Unknown"}
              @click=${()=>this.onConnectWallet(g)}
              tabIdx=${j(this.tabIdx)}
              ?loading=${this.loading}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnectWallet(e){if(this.loading)return;const i=D.getConnector(e.id,e.rdns);i?F.push("ConnectingExternal",{connector:i}):F.push("ConnectingWalletConnect",{wallet:e})}};vt([M()],Ve.prototype,"tabIdx",void 0);vt([M()],Ve.prototype,"wallets",void 0);vt([O()],Ve.prototype,"loading",void 0);Ve=vt([W("w3m-connect-recommended-widget")],Ve);var yt=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let Fe=class extends U{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=D.state.connectors,this.connectorImages=xi.state.connectorImages,this.unsubscribe.push(D.subscribeKey("connectors",e=>this.connectors=e),xi.subscribeKey("connectorImages",e=>this.connectorImages=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){if(L.isMobile())return this.style.cssText="display: none",null;const e=this.connectors.find(n=>n.id==="walletConnect");if(!e)return this.style.cssText="display: none",null;const i=e.imageUrl||this.connectorImages[(e==null?void 0:e.imageId)??""];return u`
      <wui-list-wallet
        imageSrc=${j(i)}
        name=${e.name??"Unknown"}
        @click=${()=>this.onConnector(e)}
        tagLabel="qr code"
        tagVariant="main"
        tabIdx=${j(this.tabIdx)}
        data-testid="wallet-selector-walletconnect"
      >
      </wui-list-wallet>
    `}onConnector(e){D.setActiveConnector(e),F.push("ConnectingWalletConnect")}};yt([M()],Fe.prototype,"tabIdx",void 0);yt([O()],Fe.prototype,"connectors",void 0);yt([O()],Fe.prototype,"connectorImages",void 0);Fe=yt([W("w3m-connect-walletconnect-widget")],Fe);const On=_e`
  :host {
    margin-top: var(--wui-spacing-3xs);
  }
  wui-separator {
    margin: var(--wui-spacing-m) calc(var(--wui-spacing-m) * -1) var(--wui-spacing-xs)
      calc(var(--wui-spacing-m) * -1);
    width: calc(100% + var(--wui-spacing-s) * 2);
  }
`;var Ye=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let $e=class extends U{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=D.state.connectors,this.recommended=N.state.recommended,this.featured=N.state.featured,this.unsubscribe.push(D.subscribeKey("connectors",e=>this.connectors=e),N.subscribeKey("recommended",e=>this.recommended=e),N.subscribeKey("featured",e=>this.featured=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return u`
      <wui-flex flexDirection="column" gap="xs"> ${this.connectorListTemplate()} </wui-flex>
    `}connectorListTemplate(){const{custom:e,recent:i,announced:n,injected:o,multiChain:t,recommended:a,featured:s,external:l}=tt.getConnectorsByType(this.connectors,this.recommended,this.featured);return tt.getConnectorTypeOrder({custom:e,recent:i,announced:n,injected:o,multiChain:t,recommended:a,featured:s,external:l}).map(p=>{switch(p){case"injected":return u`
            ${t.length?u`<w3m-connect-multi-chain-widget
                  tabIdx=${j(this.tabIdx)}
                ></w3m-connect-multi-chain-widget>`:null}
            ${n.length?u`<w3m-connect-announced-widget
                  tabIdx=${j(this.tabIdx)}
                ></w3m-connect-announced-widget>`:null}
            ${o.length?u`<w3m-connect-injected-widget
                  .connectors=${o}
                  tabIdx=${j(this.tabIdx)}
                ></w3m-connect-injected-widget>`:null}
          `;case"walletConnect":return u`<w3m-connect-walletconnect-widget
            tabIdx=${j(this.tabIdx)}
          ></w3m-connect-walletconnect-widget>`;case"recent":return u`<w3m-connect-recent-widget
            tabIdx=${j(this.tabIdx)}
          ></w3m-connect-recent-widget>`;case"featured":return u`<w3m-connect-featured-widget
            .wallets=${s}
            tabIdx=${j(this.tabIdx)}
          ></w3m-connect-featured-widget>`;case"custom":return u`<w3m-connect-custom-widget
            tabIdx=${j(this.tabIdx)}
          ></w3m-connect-custom-widget>`;case"external":return u`<w3m-connect-external-widget
            tabIdx=${j(this.tabIdx)}
          ></w3m-connect-external-widget>`;case"recommended":return u`<w3m-connect-recommended-widget
            .wallets=${a}
            tabIdx=${j(this.tabIdx)}
          ></w3m-connect-recommended-widget>`;default:return console.warn(`Unknown connector type: ${p}`),null}})}};$e.styles=On;Ye([M()],$e.prototype,"tabIdx",void 0);Ye([O()],$e.prototype,"connectors",void 0);Ye([O()],$e.prototype,"recommended",void 0);Ye([O()],$e.prototype,"featured",void 0);$e=Ye([W("w3m-connector-list")],$e);const An=q`
  :host {
    display: inline-flex;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-3xl);
    padding: var(--wui-spacing-3xs);
    position: relative;
    height: 36px;
    min-height: 36px;
    overflow: hidden;
  }

  :host::before {
    content: '';
    position: absolute;
    pointer-events: none;
    top: 4px;
    left: 4px;
    display: block;
    width: var(--local-tab-width);
    height: 28px;
    border-radius: var(--wui-border-radius-3xl);
    background-color: var(--wui-color-gray-glass-002);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    transform: translateX(calc(var(--local-tab) * var(--local-tab-width)));
    transition: transform var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color, opacity;
  }

  :host([data-type='flex'])::before {
    left: 3px;
    transform: translateX(calc((var(--local-tab) * 34px) + (var(--local-tab) * 4px)));
  }

  :host([data-type='flex']) {
    display: flex;
    padding: 0px 0px 0px 12px;
    gap: 4px;
  }

  :host([data-type='flex']) > button > wui-text {
    position: absolute;
    left: 18px;
    opacity: 0;
  }

  button[data-active='true'] > wui-icon,
  button[data-active='true'] > wui-text {
    color: var(--wui-color-fg-100);
  }

  button[data-active='false'] > wui-icon,
  button[data-active='false'] > wui-text {
    color: var(--wui-color-fg-200);
  }

  button[data-active='true']:disabled,
  button[data-active='false']:disabled {
    background-color: transparent;
    opacity: 0.5;
    cursor: not-allowed;
  }

  button[data-active='true']:disabled > wui-text {
    color: var(--wui-color-fg-200);
  }

  button[data-active='false']:disabled > wui-text {
    color: var(--wui-color-fg-300);
  }

  button > wui-icon,
  button > wui-text {
    pointer-events: none;
    transition: color var(--wui-e ase-out-power-1) var(--wui-duration-md);
    will-change: color;
  }

  button {
    width: var(--local-tab-width);
    transition: background-color var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color;
  }

  :host([data-type='flex']) > button {
    width: 34px;
    position: relative;
    display: flex;
    justify-content: flex-start;
  }

  button:hover:enabled,
  button:active:enabled {
    background-color: transparent !important;
  }

  button:hover:enabled > wui-icon,
  button:active:enabled > wui-icon {
    transition: all var(--wui-ease-out-power-1) var(--wui-duration-lg);
    color: var(--wui-color-fg-125);
  }

  button:hover:enabled > wui-text,
  button:active:enabled > wui-text {
    transition: all var(--wui-ease-out-power-1) var(--wui-duration-lg);
    color: var(--wui-color-fg-125);
  }

  button {
    border-radius: var(--wui-border-radius-3xl);
  }
`;var xe=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let le=class extends V{constructor(){super(...arguments),this.tabs=[],this.onTabChange=()=>null,this.buttons=[],this.disabled=!1,this.localTabWidth="100px",this.activeTab=0,this.isDense=!1}render(){return this.isDense=this.tabs.length>3,this.style.cssText=`
      --local-tab: ${this.activeTab};
      --local-tab-width: ${this.localTabWidth};
    `,this.dataset.type=this.isDense?"flex":"block",this.tabs.map((e,i)=>{var o;const n=i===this.activeTab;return E`
        <button
          ?disabled=${this.disabled}
          @click=${()=>this.onTabClick(i)}
          data-active=${n}
          data-testid="tab-${(o=e.label)==null?void 0:o.toLowerCase()}"
        >
          ${this.iconTemplate(e)}
          <wui-text variant="small-600" color="inherit"> ${e.label} </wui-text>
        </button>
      `})}firstUpdated(){this.shadowRoot&&this.isDense&&(this.buttons=[...this.shadowRoot.querySelectorAll("button")],setTimeout(()=>{this.animateTabs(0,!0)},0))}iconTemplate(e){return e.icon?E`<wui-icon size="xs" color="inherit" name=${e.icon}></wui-icon>`:null}onTabClick(e){this.buttons&&this.animateTabs(e,!1),this.activeTab=e,this.onTabChange(e)}animateTabs(e,i){const n=this.buttons[this.activeTab],o=this.buttons[e],t=n==null?void 0:n.querySelector("wui-text"),a=o==null?void 0:o.querySelector("wui-text"),s=o==null?void 0:o.getBoundingClientRect(),l=a==null?void 0:a.getBoundingClientRect();n&&t&&!i&&e!==this.activeTab&&(t.animate([{opacity:0}],{duration:50,easing:"ease",fill:"forwards"}),n.animate([{width:"34px"}],{duration:500,easing:"ease",fill:"forwards"})),o&&s&&l&&a&&(e!==this.activeTab||i)&&(this.localTabWidth=`${Math.round(s.width+l.width)+6}px`,o.animate([{width:`${s.width+l.width}px`}],{duration:i?0:500,fill:"forwards",easing:"ease"}),a.animate([{opacity:1}],{duration:i?0:125,delay:i?0:200,fill:"forwards",easing:"ease"}))}};le.styles=[K,Q,An];xe([c({type:Array})],le.prototype,"tabs",void 0);xe([c()],le.prototype,"onTabChange",void 0);xe([c({type:Array})],le.prototype,"buttons",void 0);xe([c({type:Boolean})],le.prototype,"disabled",void 0);xe([c()],le.prototype,"localTabWidth",void 0);xe([an()],le.prototype,"activeTab",void 0);xe([an()],le.prototype,"isDense",void 0);le=xe([W("wui-tabs")],le);var xt=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let Ke=class extends U{constructor(){super(),this.platformTabs=[],this.unsubscribe=[],this.platforms=[],this.onSelectPlatfrom=void 0,this.buffering=!1,this.unsubscribe.push(z.subscribeKey("buffering",e=>this.buffering=e))}disconnectCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.generateTabs();return u`
      <wui-flex justifyContent="center" .padding=${["0","0","l","0"]}>
        <wui-tabs
          ?disabled=${this.buffering}
          .tabs=${e}
          .onTabChange=${this.onTabChange.bind(this)}
        ></wui-tabs>
      </wui-flex>
    `}generateTabs(){const e=this.platforms.map(i=>i==="browser"?{label:"Browser",icon:"extension",platform:"browser"}:i==="mobile"?{label:"Mobile",icon:"mobile",platform:"mobile"}:i==="qrcode"?{label:"Mobile",icon:"mobile",platform:"qrcode"}:i==="web"?{label:"Webapp",icon:"browser",platform:"web"}:i==="desktop"?{label:"Desktop",icon:"desktop",platform:"desktop"}:{label:"Browser",icon:"extension",platform:"unsupported"});return this.platformTabs=e.map(({platform:i})=>i),e}onTabChange(e){var n;const i=this.platformTabs[e];i&&((n=this.onSelectPlatfrom)==null||n.call(this,i))}};xt([M({type:Array})],Ke.prototype,"platforms",void 0);xt([M()],Ke.prototype,"onSelectPlatfrom",void 0);xt([O()],Ke.prototype,"buffering",void 0);Ke=xt([W("w3m-connecting-header")],Ke);const jn=q`
  :host {
    width: var(--local-width);
    position: relative;
  }

  button {
    border: none;
    border-radius: var(--local-border-radius);
    width: var(--local-width);
    white-space: nowrap;
  }

  /* -- Sizes --------------------------------------------------- */
  button[data-size='md'] {
    padding: 8.2px var(--wui-spacing-l) 9px var(--wui-spacing-l);
    height: 36px;
  }

  button[data-size='md'][data-icon-left='true'][data-icon-right='false'] {
    padding: 8.2px var(--wui-spacing-l) 9px var(--wui-spacing-s);
  }

  button[data-size='md'][data-icon-right='true'][data-icon-left='false'] {
    padding: 8.2px var(--wui-spacing-s) 9px var(--wui-spacing-l);
  }

  button[data-size='lg'] {
    padding: var(--wui-spacing-m) var(--wui-spacing-2l);
    height: 48px;
  }

  /* -- Variants --------------------------------------------------------- */
  button[data-variant='main'] {
    background-color: var(--wui-color-accent-100);
    color: var(--wui-color-inverse-100);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  button[data-variant='inverse'] {
    background-color: var(--wui-color-inverse-100);
    color: var(--wui-color-inverse-000);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  button[data-variant='accent'] {
    background-color: var(--wui-color-accent-glass-010);
    color: var(--wui-color-accent-100);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  button[data-variant='accent-error'] {
    background: var(--wui-color-error-glass-015);
    color: var(--wui-color-error-100);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-error-glass-010);
  }

  button[data-variant='accent-success'] {
    background: var(--wui-color-success-glass-015);
    color: var(--wui-color-success-100);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-success-glass-010);
  }

  button[data-variant='neutral'] {
    background: transparent;
    color: var(--wui-color-fg-100);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  /* -- Focus states --------------------------------------------------- */
  button[data-variant='main']:focus-visible:enabled {
    background-color: var(--wui-color-accent-090);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0 0 0 4px var(--wui-color-accent-glass-020);
  }
  button[data-variant='inverse']:focus-visible:enabled {
    background-color: var(--wui-color-inverse-100);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-gray-glass-010),
      0 0 0 4px var(--wui-color-accent-glass-020);
  }
  button[data-variant='accent']:focus-visible:enabled {
    background-color: var(--wui-color-accent-glass-010);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0 0 0 4px var(--wui-color-accent-glass-020);
  }
  button[data-variant='accent-error']:focus-visible:enabled {
    background: var(--wui-color-error-glass-015);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-error-100),
      0 0 0 4px var(--wui-color-error-glass-020);
  }
  button[data-variant='accent-success']:focus-visible:enabled {
    background: var(--wui-color-success-glass-015);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-success-100),
      0 0 0 4px var(--wui-color-success-glass-020);
  }
  button[data-variant='neutral']:focus-visible:enabled {
    background: var(--wui-color-gray-glass-005);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-gray-glass-010),
      0 0 0 4px var(--wui-color-gray-glass-002);
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  @media (hover: hover) and (pointer: fine) {
    button[data-variant='main']:hover:enabled {
      background-color: var(--wui-color-accent-090);
    }

    button[data-variant='main']:active:enabled {
      background-color: var(--wui-color-accent-080);
    }

    button[data-variant='accent']:hover:enabled {
      background-color: var(--wui-color-accent-glass-015);
    }

    button[data-variant='accent']:active:enabled {
      background-color: var(--wui-color-accent-glass-020);
    }

    button[data-variant='accent-error']:hover:enabled {
      background: var(--wui-color-error-glass-020);
      color: var(--wui-color-error-100);
    }

    button[data-variant='accent-error']:active:enabled {
      background: var(--wui-color-error-glass-030);
      color: var(--wui-color-error-100);
    }

    button[data-variant='accent-success']:hover:enabled {
      background: var(--wui-color-success-glass-020);
      color: var(--wui-color-success-100);
    }

    button[data-variant='accent-success']:active:enabled {
      background: var(--wui-color-success-glass-030);
      color: var(--wui-color-success-100);
    }

    button[data-variant='neutral']:hover:enabled {
      background: var(--wui-color-gray-glass-002);
    }

    button[data-variant='neutral']:active:enabled {
      background: var(--wui-color-gray-glass-005);
    }

    button[data-size='lg'][data-icon-left='true'][data-icon-right='false'] {
      padding-left: var(--wui-spacing-m);
    }

    button[data-size='lg'][data-icon-right='true'][data-icon-left='false'] {
      padding-right: var(--wui-spacing-m);
    }
  }

  /* -- Disabled state --------------------------------------------------- */
  button:disabled {
    background-color: var(--wui-color-gray-glass-002);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    color: var(--wui-color-gray-glass-020);
    cursor: not-allowed;
  }

  button > wui-text {
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
    opacity: var(--local-opacity-100);
  }

  ::slotted(*) {
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
    opacity: var(--local-opacity-100);
  }

  wui-loading-spinner {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    opacity: var(--local-opacity-000);
  }
`;var ce=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};const $i={main:"inverse-100",inverse:"inverse-000",accent:"accent-100","accent-error":"error-100","accent-success":"success-100",neutral:"fg-100",disabled:"gray-glass-020"},zn={lg:"paragraph-600",md:"small-600"},kn={lg:"md",md:"md"};let ee=class extends V{constructor(){super(...arguments),this.size="lg",this.disabled=!1,this.fullWidth=!1,this.loading=!1,this.variant="main",this.hasIconLeft=!1,this.hasIconRight=!1,this.borderRadius="m"}render(){this.style.cssText=`
    --local-width: ${this.fullWidth?"100%":"auto"};
    --local-opacity-100: ${this.loading?0:1};
    --local-opacity-000: ${this.loading?1:0};
    --local-border-radius: var(--wui-border-radius-${this.borderRadius});
    `;const e=this.textVariant??zn[this.size];return E`
      <button
        data-variant=${this.variant}
        data-icon-left=${this.hasIconLeft}
        data-icon-right=${this.hasIconRight}
        data-size=${this.size}
        ?disabled=${this.disabled}
      >
        ${this.loadingTemplate()}
        <slot name="iconLeft" @slotchange=${()=>this.handleSlotLeftChange()}></slot>
        <wui-text variant=${e} color="inherit">
          <slot></slot>
        </wui-text>
        <slot name="iconRight" @slotchange=${()=>this.handleSlotRightChange()}></slot>
      </button>
    `}handleSlotLeftChange(){this.hasIconLeft=!0}handleSlotRightChange(){this.hasIconRight=!0}loadingTemplate(){if(this.loading){const e=kn[this.size],i=this.disabled?$i.disabled:$i[this.variant];return E`<wui-loading-spinner color=${i} size=${e}></wui-loading-spinner>`}return E``}};ee.styles=[K,Q,jn];ce([c()],ee.prototype,"size",void 0);ce([c({type:Boolean})],ee.prototype,"disabled",void 0);ce([c({type:Boolean})],ee.prototype,"fullWidth",void 0);ce([c({type:Boolean})],ee.prototype,"loading",void 0);ce([c()],ee.prototype,"variant",void 0);ce([c({type:Boolean})],ee.prototype,"hasIconLeft",void 0);ce([c({type:Boolean})],ee.prototype,"hasIconRight",void 0);ce([c()],ee.prototype,"borderRadius",void 0);ce([c()],ee.prototype,"textVariant",void 0);ee=ce([W("wui-button")],ee);const Dn=q`
  button {
    padding: var(--wui-spacing-4xs) var(--wui-spacing-xxs);
    border-radius: var(--wui-border-radius-3xs);
    background-color: transparent;
    color: var(--wui-color-accent-100);
  }

  button:disabled {
    background-color: transparent;
    color: var(--wui-color-gray-glass-015);
  }

  button:hover {
    background-color: var(--wui-color-gray-glass-005);
  }
`;var Ct=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let Ae=class extends V{constructor(){super(...arguments),this.tabIdx=void 0,this.disabled=!1,this.color="inherit"}render(){return E`
      <button ?disabled=${this.disabled} tabindex=${ge(this.tabIdx)}>
        <slot name="iconLeft"></slot>
        <wui-text variant="small-600" color=${this.color}>
          <slot></slot>
        </wui-text>
        <slot name="iconRight"></slot>
      </button>
    `}};Ae.styles=[K,Q,Dn];Ct([c()],Ae.prototype,"tabIdx",void 0);Ct([c({type:Boolean})],Ae.prototype,"disabled",void 0);Ct([c()],Ae.prototype,"color",void 0);Ae=Ct([W("wui-link")],Ae);const Nn=q`
  :host {
    display: block;
    width: var(--wui-box-size-md);
    height: var(--wui-box-size-md);
  }

  svg {
    width: var(--wui-box-size-md);
    height: var(--wui-box-size-md);
  }

  rect {
    fill: none;
    stroke: var(--wui-color-accent-100);
    stroke-width: 4px;
    stroke-linecap: round;
    animation: dash 1s linear infinite;
  }

  @keyframes dash {
    to {
      stroke-dashoffset: 0px;
    }
  }
`;var ln=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let ct=class extends V{constructor(){super(...arguments),this.radius=36}render(){return this.svgLoaderTemplate()}svgLoaderTemplate(){const e=this.radius>50?50:this.radius,n=36-e,o=116+n,t=245+n,a=360+n*1.75;return E`
      <svg viewBox="0 0 110 110" width="110" height="110">
        <rect
          x="2"
          y="2"
          width="106"
          height="106"
          rx=${e}
          stroke-dasharray="${o} ${t}"
          stroke-dashoffset=${a}
        />
      </svg>
    `}};ct.styles=[K,Nn];ln([c({type:Number})],ct.prototype,"radius",void 0);ct=ln([W("wui-loading-thumbnail")],ct);const Mn=q`
  button {
    border: none;
    border-radius: var(--wui-border-radius-3xl);
  }

  button[data-variant='main'] {
    background-color: var(--wui-color-accent-100);
    color: var(--wui-color-inverse-100);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  button[data-variant='accent'] {
    background-color: var(--wui-color-accent-glass-010);
    color: var(--wui-color-accent-100);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  button[data-variant='gray'] {
    background-color: transparent;
    color: var(--wui-color-fg-200);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  button[data-variant='shade'] {
    background-color: transparent;
    color: var(--wui-color-accent-100);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  button[data-size='sm'] {
    height: 32px;
    padding: 0 var(--wui-spacing-s);
  }

  button[data-size='md'] {
    height: 40px;
    padding: 0 var(--wui-spacing-l);
  }

  button[data-size='sm'] > wui-image {
    width: 16px;
    height: 16px;
  }

  button[data-size='md'] > wui-image {
    width: 24px;
    height: 24px;
  }

  button[data-size='sm'] > wui-icon {
    width: 12px;
    height: 12px;
  }

  button[data-size='md'] > wui-icon {
    width: 14px;
    height: 14px;
  }

  wui-image {
    border-radius: var(--wui-border-radius-3xl);
    overflow: hidden;
  }

  button.disabled > wui-icon,
  button.disabled > wui-image {
    filter: grayscale(1);
  }

  button[data-variant='main'] > wui-image {
    box-shadow: inset 0 0 0 1px var(--wui-color-accent-090);
  }

  button[data-variant='shade'] > wui-image,
  button[data-variant='gray'] > wui-image {
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  @media (hover: hover) and (pointer: fine) {
    button[data-variant='main']:focus-visible {
      background-color: var(--wui-color-accent-090);
    }

    button[data-variant='main']:hover:enabled {
      background-color: var(--wui-color-accent-090);
    }

    button[data-variant='main']:active:enabled {
      background-color: var(--wui-color-accent-080);
    }

    button[data-variant='accent']:hover:enabled {
      background-color: var(--wui-color-accent-glass-015);
    }

    button[data-variant='accent']:active:enabled {
      background-color: var(--wui-color-accent-glass-020);
    }

    button[data-variant='shade']:focus-visible,
    button[data-variant='gray']:focus-visible,
    button[data-variant='shade']:hover,
    button[data-variant='gray']:hover {
      background-color: var(--wui-color-gray-glass-002);
    }

    button[data-variant='gray']:active,
    button[data-variant='shade']:active {
      background-color: var(--wui-color-gray-glass-005);
    }
  }

  button.disabled {
    color: var(--wui-color-gray-glass-020);
    background-color: var(--wui-color-gray-glass-002);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    pointer-events: none;
  }
`;var We=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let be=class extends V{constructor(){super(...arguments),this.variant="accent",this.imageSrc="",this.disabled=!1,this.icon="externalLink",this.size="md",this.text=""}render(){const e=this.size==="sm"?"small-600":"paragraph-600";return E`
      <button
        class=${this.disabled?"disabled":""}
        data-variant=${this.variant}
        data-size=${this.size}
      >
        ${this.imageSrc?E`<wui-image src=${this.imageSrc}></wui-image>`:null}
        <wui-text variant=${e} color="inherit"> ${this.text} </wui-text>
        <wui-icon name=${this.icon} color="inherit" size="inherit"></wui-icon>
      </button>
    `}};be.styles=[K,Q,Mn];We([c()],be.prototype,"variant",void 0);We([c()],be.prototype,"imageSrc",void 0);We([c({type:Boolean})],be.prototype,"disabled",void 0);We([c()],be.prototype,"icon",void 0);We([c()],be.prototype,"size",void 0);We([c()],be.prototype,"text",void 0);be=We([W("wui-chip-button")],be);const Un=q`
  wui-flex {
    width: 100%;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
  }
`;var $t=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let je=class extends V{constructor(){super(...arguments),this.disabled=!1,this.label="",this.buttonLabel=""}render(){return E`
      <wui-flex
        justifyContent="space-between"
        alignItems="center"
        .padding=${["1xs","2l","1xs","2l"]}
      >
        <wui-text variant="paragraph-500" color="fg-200">${this.label}</wui-text>
        <wui-chip-button size="sm" variant="shade" text=${this.buttonLabel} icon="chevronRight">
        </wui-chip-button>
      </wui-flex>
    `}};je.styles=[K,Q,Un];$t([c({type:Boolean})],je.prototype,"disabled",void 0);$t([c()],je.prototype,"label",void 0);$t([c()],je.prototype,"buttonLabel",void 0);je=$t([W("wui-cta-button")],je);const qn=_e`
  :host {
    display: block;
    padding: 0 var(--wui-spacing-xl) var(--wui-spacing-xl);
  }
`;var cn=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let ut=class extends U{constructor(){super(...arguments),this.wallet=void 0}render(){if(!this.wallet)return this.style.display="none",null;const{name:e,app_store:i,play_store:n,chrome_store:o,homepage:t}=this.wallet,a=L.isMobile(),s=L.isIos(),l=L.isAndroid(),d=[i,n,t,o].filter(Boolean).length>1,p=pe.getTruncateString({string:e,charsStart:12,charsEnd:0,truncate:"end"});return d&&!a?u`
        <wui-cta-button
          label=${`Don't have ${p}?`}
          buttonLabel="Get"
          @click=${()=>F.push("Downloads",{wallet:this.wallet})}
        ></wui-cta-button>
      `:!d&&t?u`
        <wui-cta-button
          label=${`Don't have ${p}?`}
          buttonLabel="Get"
          @click=${this.onHomePage.bind(this)}
        ></wui-cta-button>
      `:i&&s?u`
        <wui-cta-button
          label=${`Don't have ${p}?`}
          buttonLabel="Get"
          @click=${this.onAppStore.bind(this)}
        ></wui-cta-button>
      `:n&&l?u`
        <wui-cta-button
          label=${`Don't have ${p}?`}
          buttonLabel="Get"
          @click=${this.onPlayStore.bind(this)}
        ></wui-cta-button>
      `:(this.style.display="none",null)}onAppStore(){var e;(e=this.wallet)!=null&&e.app_store&&L.openHref(this.wallet.app_store,"_blank")}onPlayStore(){var e;(e=this.wallet)!=null&&e.play_store&&L.openHref(this.wallet.play_store,"_blank")}onHomePage(){var e;(e=this.wallet)!=null&&e.homepage&&L.openHref(this.wallet.homepage,"_blank")}};ut.styles=[qn];cn([M({type:Object})],ut.prototype,"wallet",void 0);ut=cn([W("w3m-mobile-download-links")],ut);const Vn=_e`
  @keyframes shake {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(3px);
    }
    50% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(3px);
    }
    100% {
      transform: translateX(0);
    }
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-loading-thumbnail {
    position: absolute;
  }

  wui-icon-box {
    position: absolute;
    right: calc(var(--wui-spacing-3xs) * -1);
    bottom: calc(var(--wui-spacing-3xs) * -1);
    opacity: 0;
    transform: scale(0.5);
    transition-property: opacity, transform;
    transition-duration: var(--wui-duration-lg);
    transition-timing-function: var(--wui-ease-out-power-2);
    will-change: opacity, transform;
  }

  wui-text[align='center'] {
    width: 100%;
    padding: 0px var(--wui-spacing-l);
  }

  [data-error='true'] wui-icon-box {
    opacity: 1;
    transform: scale(1);
  }

  [data-error='true'] > wui-flex:first-child {
    animation: shake 250ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }

  [data-retry='false'] wui-link {
    display: none;
  }

  [data-retry='true'] wui-link {
    display: block;
    opacity: 1;
  }
`;var re=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};class H extends U{constructor(){var e,i,n,o,t;super(),this.wallet=(e=F.state.data)==null?void 0:e.wallet,this.connector=(i=F.state.data)==null?void 0:i.connector,this.timeout=void 0,this.secondaryBtnIcon="refresh",this.onConnect=void 0,this.onRender=void 0,this.onAutoConnect=void 0,this.isWalletConnect=!0,this.unsubscribe=[],this.imageSrc=Y.getWalletImage(this.wallet)??Y.getConnectorImage(this.connector),this.name=((n=this.wallet)==null?void 0:n.name)??((o=this.connector)==null?void 0:o.name)??"Wallet",this.isRetrying=!1,this.uri=z.state.wcUri,this.error=z.state.wcError,this.ready=!1,this.showRetry=!1,this.secondaryBtnLabel="Try again",this.secondaryLabel="Accept connection request in the wallet",this.buffering=!1,this.isLoading=!1,this.isMobile=!1,this.onRetry=void 0,this.unsubscribe.push(z.subscribeKey("wcUri",a=>{var s;this.uri=a,this.isRetrying&&this.onRetry&&(this.isRetrying=!1,(s=this.onConnect)==null||s.call(this))}),z.subscribeKey("wcError",a=>this.error=a),z.subscribeKey("buffering",a=>this.buffering=a)),(L.isTelegram()||L.isSafari())&&L.isIos()&&z.state.wcUri&&((t=this.onConnect)==null||t.call(this))}firstUpdated(){var e;(e=this.onAutoConnect)==null||e.call(this),this.showRetry=!this.onAutoConnect}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),clearTimeout(this.timeout)}render(){var n;(n=this.onRender)==null||n.call(this),this.onShowRetry();const e=this.error?"Connection can be declined if a previous request is still active":this.secondaryLabel;let i=`Continue in ${this.name}`;return this.buffering&&(i="Connecting..."),this.error&&(i="Connection declined"),u`
      <wui-flex
        data-error=${j(this.error)}
        data-retry=${this.showRetry}
        flexDirection="column"
        alignItems="center"
        .padding=${["3xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-wallet-image size="lg" imageSrc=${j(this.imageSrc)}></wui-wallet-image>

          ${this.error?null:this.loaderTemplate()}

          <wui-icon-box
            backgroundColor="error-100"
            background="opaque"
            iconColor="error-100"
            icon="close"
            size="sm"
            border
            borderColor="wui-color-bg-125"
          ></wui-icon-box>
        </wui-flex>

        <wui-flex flexDirection="column" alignItems="center" gap="xs">
          <wui-text variant="paragraph-500" color=${this.error?"error-100":"fg-100"}>
            ${i}
          </wui-text>
          <wui-text align="center" variant="small-500" color="fg-200">${e}</wui-text>
        </wui-flex>

        ${this.secondaryBtnLabel?u`
              <wui-button
                variant="accent"
                size="md"
                ?disabled=${this.isRetrying||!this.error&&this.buffering||this.isLoading}
                @click=${this.onTryAgain.bind(this)}
                data-testid="w3m-connecting-widget-secondary-button"
              >
                <wui-icon color="inherit" slot="iconLeft" name=${this.secondaryBtnIcon}></wui-icon>
                ${this.secondaryBtnLabel}
              </wui-button>
            `:null}
      </wui-flex>

      ${this.isWalletConnect?u`
            <wui-flex .padding=${["0","xl","xl","xl"]} justifyContent="center">
              <wui-link @click=${this.onCopyUri} color="fg-200" data-testid="wui-link-copy">
                <wui-icon size="xs" color="fg-200" slot="iconLeft" name="copy"></wui-icon>
                Copy link
              </wui-link>
            </wui-flex>
          `:null}

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}onShowRetry(){var e;if(this.error&&!this.showRetry){this.showRetry=!0;const i=(e=this.shadowRoot)==null?void 0:e.querySelector("wui-button");i==null||i.animate([{opacity:0},{opacity:1}],{fill:"forwards",easing:"ease"})}}onTryAgain(){var e,i;this.buffering||(z.setWcError(!1),this.onRetry?(this.isRetrying=!0,(e=this.onRetry)==null||e.call(this)):(i=this.onConnect)==null||i.call(this))}loaderTemplate(){const e=ii.state.themeVariables["--w3m-border-radius-master"],i=e?parseInt(e.replace("px",""),10):4;return u`<wui-loading-thumbnail radius=${i*9}></wui-loading-thumbnail>`}onCopyUri(){try{this.uri&&(L.copyToClopboard(this.uri),it.showSuccess("Link copied"))}catch{it.showError("Failed to copy")}}}H.styles=Vn;re([O()],H.prototype,"isRetrying",void 0);re([O()],H.prototype,"uri",void 0);re([O()],H.prototype,"error",void 0);re([O()],H.prototype,"ready",void 0);re([O()],H.prototype,"showRetry",void 0);re([O()],H.prototype,"secondaryBtnLabel",void 0);re([O()],H.prototype,"secondaryLabel",void 0);re([O()],H.prototype,"buffering",void 0);re([O()],H.prototype,"isLoading",void 0);re([M({type:Boolean})],H.prototype,"isMobile",void 0);re([M()],H.prototype,"onRetry",void 0);var Fn=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let Ri=class extends H{constructor(){if(super(),!this.wallet)throw new Error("w3m-connecting-wc-browser: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onAutoConnect=this.onConnectProxy.bind(this),ne.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser"}})}async onConnectProxy(){var e;try{this.error=!1;const{connectors:i}=D.state,n=i.find(o=>{var t,a,s;return o.type==="ANNOUNCED"&&((t=o.info)==null?void 0:t.rdns)===((a=this.wallet)==null?void 0:a.rdns)||o.type==="INJECTED"||o.name===((s=this.wallet)==null?void 0:s.name)});if(n)await z.connectExternal(n,n.chain);else throw new Error("w3m-connecting-wc-browser: No connector found");rn.close(),ne.sendEvent({type:"track",event:"CONNECT_SUCCESS",properties:{method:"browser",name:((e=this.wallet)==null?void 0:e.name)||"Unknown"}})}catch(i){ne.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:(i==null?void 0:i.message)??"Unknown"}}),this.error=!0}}};Ri=Fn([W("w3m-connecting-wc-browser")],Ri);var Kn=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let Ii=class extends H{constructor(){if(super(),!this.wallet)throw new Error("w3m-connecting-wc-desktop: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onRender=this.onRenderProxy.bind(this),ne.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"desktop"}})}onRenderProxy(){var e;!this.ready&&this.uri&&(this.ready=!0,(e=this.onConnect)==null||e.call(this))}onConnectProxy(){var e;if((e=this.wallet)!=null&&e.desktop_link&&this.uri)try{this.error=!1;const{desktop_link:i,name:n}=this.wallet,{redirect:o,href:t}=L.formatNativeUrl(i,this.uri);z.setWcLinking({name:n,href:t}),z.setRecentWallet(this.wallet),L.openHref(o,"_blank")}catch{this.error=!0}}};Ii=Kn([W("w3m-connecting-wc-desktop")],Ii);var Hn=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let Ei=class extends H{constructor(){if(super(),this.btnLabelTimeout=void 0,this.labelTimeout=void 0,this.onRender=()=>{var e;!this.ready&&this.uri&&(this.ready=!0,(e=this.onConnect)==null||e.call(this))},this.onConnect=()=>{var e;if((e=this.wallet)!=null&&e.mobile_link&&this.uri)try{this.error=!1;const{mobile_link:i,name:n}=this.wallet,{redirect:o,href:t}=L.formatNativeUrl(i,this.uri);z.setWcLinking({name:n,href:t}),z.setRecentWallet(this.wallet);const a=L.isIframe()?"_top":"_self";L.openHref(o,a),clearTimeout(this.labelTimeout),this.secondaryLabel=De.CONNECT_LABELS.MOBILE}catch(i){ne.sendEvent({type:"track",event:"CONNECT_PROXY_ERROR",properties:{message:i instanceof Error?i.message:"Error parsing the deeplink",uri:this.uri,mobile_link:this.wallet.mobile_link,name:this.wallet.name}}),this.error=!0}},!this.wallet)throw new Error("w3m-connecting-wc-mobile: No wallet provided");this.secondaryBtnLabel=void 0,this.secondaryLabel=De.CONNECT_LABELS.MOBILE,document.addEventListener("visibilitychange",this.onBuffering.bind(this)),ne.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"mobile"}}),this.btnLabelTimeout=setTimeout(()=>{this.secondaryBtnLabel="Try again",this.secondaryLabel=De.CONNECT_LABELS.MOBILE},De.FIVE_SEC_MS),this.labelTimeout=setTimeout(()=>{this.secondaryLabel="Hold tight... it's taking longer than expected"},De.THREE_SEC_MS)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("visibilitychange",this.onBuffering.bind(this)),clearTimeout(this.btnLabelTimeout),clearTimeout(this.labelTimeout)}onBuffering(){const e=L.isIos();(document==null?void 0:document.visibilityState)==="visible"&&!this.error&&e&&(z.setBuffering(!0),setTimeout(()=>{z.setBuffering(!1)},5e3))}onTryAgain(){this.buffering||(z.setWcError(!1),this.onConnect())}};Ei=Hn([W("w3m-connecting-wc-mobile")],Ei);var Le={},Pt,_i;function Gn(){return _i||(_i=1,Pt=function(){return typeof Promise=="function"&&Promise.prototype&&Promise.prototype.then}),Pt}var Bt={},ye={},Si;function Te(){if(Si)return ye;Si=1;let r;const e=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];return ye.getSymbolSize=function(n){if(!n)throw new Error('"version" cannot be null or undefined');if(n<1||n>40)throw new Error('"version" should be in range from 1 to 40');return n*4+17},ye.getSymbolTotalCodewords=function(n){return e[n]},ye.getBCHDigit=function(i){let n=0;for(;i!==0;)n++,i>>>=1;return n},ye.setToSJISFunction=function(n){if(typeof n!="function")throw new Error('"toSJISFunc" is not a valid function.');r=n},ye.isKanjiModeEnabled=function(){return typeof r<"u"},ye.toSJIS=function(n){return r(n)},ye}var Lt={},Wi;function pi(){return Wi||(Wi=1,(function(r){r.L={bit:1},r.M={bit:0},r.Q={bit:3},r.H={bit:2};function e(i){if(typeof i!="string")throw new Error("Param is not a string");switch(i.toLowerCase()){case"l":case"low":return r.L;case"m":case"medium":return r.M;case"q":case"quartile":return r.Q;case"h":case"high":return r.H;default:throw new Error("Unknown EC Level: "+i)}}r.isValid=function(n){return n&&typeof n.bit<"u"&&n.bit>=0&&n.bit<4},r.from=function(n,o){if(r.isValid(n))return n;try{return e(n)}catch{return o}}})(Lt)),Lt}var Ot,Ti;function Yn(){if(Ti)return Ot;Ti=1;function r(){this.buffer=[],this.length=0}return r.prototype={get:function(e){const i=Math.floor(e/8);return(this.buffer[i]>>>7-e%8&1)===1},put:function(e,i){for(let n=0;n<i;n++)this.putBit((e>>>i-n-1&1)===1)},getLengthInBits:function(){return this.length},putBit:function(e){const i=Math.floor(this.length/8);this.buffer.length<=i&&this.buffer.push(0),e&&(this.buffer[i]|=128>>>this.length%8),this.length++}},Ot=r,Ot}var At,Pi;function Jn(){if(Pi)return At;Pi=1;function r(e){if(!e||e<1)throw new Error("BitMatrix size must be defined and greater than 0");this.size=e,this.data=new Uint8Array(e*e),this.reservedBit=new Uint8Array(e*e)}return r.prototype.set=function(e,i,n,o){const t=e*this.size+i;this.data[t]=n,o&&(this.reservedBit[t]=!0)},r.prototype.get=function(e,i){return this.data[e*this.size+i]},r.prototype.xor=function(e,i,n){this.data[e*this.size+i]^=n},r.prototype.isReserved=function(e,i){return this.reservedBit[e*this.size+i]},At=r,At}var jt={},Bi;function Qn(){return Bi||(Bi=1,(function(r){const e=Te().getSymbolSize;r.getRowColCoords=function(n){if(n===1)return[];const o=Math.floor(n/7)+2,t=e(n),a=t===145?26:Math.ceil((t-13)/(2*o-2))*2,s=[t-7];for(let l=1;l<o-1;l++)s[l]=s[l-1]-a;return s.push(6),s.reverse()},r.getPositions=function(n){const o=[],t=r.getRowColCoords(n),a=t.length;for(let s=0;s<a;s++)for(let l=0;l<a;l++)s===0&&l===0||s===0&&l===a-1||s===a-1&&l===0||o.push([t[s],t[l]]);return o}})(jt)),jt}var zt={},Li;function Xn(){if(Li)return zt;Li=1;const r=Te().getSymbolSize,e=7;return zt.getPositions=function(n){const o=r(n);return[[0,0],[o-e,0],[0,o-e]]},zt}var kt={},Oi;function Zn(){return Oi||(Oi=1,(function(r){r.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};const e={N1:3,N2:3,N3:40,N4:10};r.isValid=function(o){return o!=null&&o!==""&&!isNaN(o)&&o>=0&&o<=7},r.from=function(o){return r.isValid(o)?parseInt(o,10):void 0},r.getPenaltyN1=function(o){const t=o.size;let a=0,s=0,l=0,d=null,p=null;for(let g=0;g<t;g++){s=l=0,d=p=null;for(let C=0;C<t;C++){let w=o.get(g,C);w===d?s++:(s>=5&&(a+=e.N1+(s-5)),d=w,s=1),w=o.get(C,g),w===p?l++:(l>=5&&(a+=e.N1+(l-5)),p=w,l=1)}s>=5&&(a+=e.N1+(s-5)),l>=5&&(a+=e.N1+(l-5))}return a},r.getPenaltyN2=function(o){const t=o.size;let a=0;for(let s=0;s<t-1;s++)for(let l=0;l<t-1;l++){const d=o.get(s,l)+o.get(s,l+1)+o.get(s+1,l)+o.get(s+1,l+1);(d===4||d===0)&&a++}return a*e.N2},r.getPenaltyN3=function(o){const t=o.size;let a=0,s=0,l=0;for(let d=0;d<t;d++){s=l=0;for(let p=0;p<t;p++)s=s<<1&2047|o.get(d,p),p>=10&&(s===1488||s===93)&&a++,l=l<<1&2047|o.get(p,d),p>=10&&(l===1488||l===93)&&a++}return a*e.N3},r.getPenaltyN4=function(o){let t=0;const a=o.data.length;for(let l=0;l<a;l++)t+=o.data[l];return Math.abs(Math.ceil(t*100/a/5)-10)*e.N4};function i(n,o,t){switch(n){case r.Patterns.PATTERN000:return(o+t)%2===0;case r.Patterns.PATTERN001:return o%2===0;case r.Patterns.PATTERN010:return t%3===0;case r.Patterns.PATTERN011:return(o+t)%3===0;case r.Patterns.PATTERN100:return(Math.floor(o/2)+Math.floor(t/3))%2===0;case r.Patterns.PATTERN101:return o*t%2+o*t%3===0;case r.Patterns.PATTERN110:return(o*t%2+o*t%3)%2===0;case r.Patterns.PATTERN111:return(o*t%3+(o+t)%2)%2===0;default:throw new Error("bad maskPattern:"+n)}}r.applyMask=function(o,t){const a=t.size;for(let s=0;s<a;s++)for(let l=0;l<a;l++)t.isReserved(l,s)||t.xor(l,s,i(o,l,s))},r.getBestMask=function(o,t){const a=Object.keys(r.Patterns).length;let s=0,l=1/0;for(let d=0;d<a;d++){t(d),r.applyMask(d,o);const p=r.getPenaltyN1(o)+r.getPenaltyN2(o)+r.getPenaltyN3(o)+r.getPenaltyN4(o);r.applyMask(d,o),p<l&&(l=p,s=d)}return s}})(kt)),kt}var et={},Ai;function un(){if(Ai)return et;Ai=1;const r=pi(),e=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],i=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];return et.getBlocksCount=function(o,t){switch(t){case r.L:return e[(o-1)*4+0];case r.M:return e[(o-1)*4+1];case r.Q:return e[(o-1)*4+2];case r.H:return e[(o-1)*4+3];default:return}},et.getTotalCodewordsCount=function(o,t){switch(t){case r.L:return i[(o-1)*4+0];case r.M:return i[(o-1)*4+1];case r.Q:return i[(o-1)*4+2];case r.H:return i[(o-1)*4+3];default:return}},et}var Dt={},Ne={},ji;function eo(){if(ji)return Ne;ji=1;const r=new Uint8Array(512),e=new Uint8Array(256);return(function(){let n=1;for(let o=0;o<255;o++)r[o]=n,e[n]=o,n<<=1,n&256&&(n^=285);for(let o=255;o<512;o++)r[o]=r[o-255]})(),Ne.log=function(n){if(n<1)throw new Error("log("+n+")");return e[n]},Ne.exp=function(n){return r[n]},Ne.mul=function(n,o){return n===0||o===0?0:r[e[n]+e[o]]},Ne}var zi;function to(){return zi||(zi=1,(function(r){const e=eo();r.mul=function(n,o){const t=new Uint8Array(n.length+o.length-1);for(let a=0;a<n.length;a++)for(let s=0;s<o.length;s++)t[a+s]^=e.mul(n[a],o[s]);return t},r.mod=function(n,o){let t=new Uint8Array(n);for(;t.length-o.length>=0;){const a=t[0];for(let l=0;l<o.length;l++)t[l]^=e.mul(o[l],a);let s=0;for(;s<t.length&&t[s]===0;)s++;t=t.slice(s)}return t},r.generateECPolynomial=function(n){let o=new Uint8Array([1]);for(let t=0;t<n;t++)o=r.mul(o,new Uint8Array([1,e.exp(t)]));return o}})(Dt)),Dt}var Nt,ki;function io(){if(ki)return Nt;ki=1;const r=to();function e(i){this.genPoly=void 0,this.degree=i,this.degree&&this.initialize(this.degree)}return e.prototype.initialize=function(n){this.degree=n,this.genPoly=r.generateECPolynomial(this.degree)},e.prototype.encode=function(n){if(!this.genPoly)throw new Error("Encoder not initialized");const o=new Uint8Array(n.length+this.degree);o.set(n);const t=r.mod(o,this.genPoly),a=this.degree-t.length;if(a>0){const s=new Uint8Array(this.degree);return s.set(t,a),s}return t},Nt=e,Nt}var Mt={},Ut={},qt={},Di;function dn(){return Di||(Di=1,qt.isValid=function(e){return!isNaN(e)&&e>=1&&e<=40}),qt}var se={},Ni;function hn(){if(Ni)return se;Ni=1;const r="[0-9]+",e="[A-Z $%*+\\-./:]+";let i="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";i=i.replace(/u/g,"\\u");const n="(?:(?![A-Z0-9 $%*+\\-./:]|"+i+`)(?:.|[\r
]))+`;se.KANJI=new RegExp(i,"g"),se.BYTE_KANJI=new RegExp("[^A-Z0-9 $%*+\\-./:]+","g"),se.BYTE=new RegExp(n,"g"),se.NUMERIC=new RegExp(r,"g"),se.ALPHANUMERIC=new RegExp(e,"g");const o=new RegExp("^"+i+"$"),t=new RegExp("^"+r+"$"),a=new RegExp("^[A-Z0-9 $%*+\\-./:]+$");return se.testKanji=function(l){return o.test(l)},se.testNumeric=function(l){return t.test(l)},se.testAlphanumeric=function(l){return a.test(l)},se}var Mi;function Pe(){return Mi||(Mi=1,(function(r){const e=dn(),i=hn();r.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]},r.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]},r.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]},r.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]},r.MIXED={bit:-1},r.getCharCountIndicator=function(t,a){if(!t.ccBits)throw new Error("Invalid mode: "+t);if(!e.isValid(a))throw new Error("Invalid version: "+a);return a>=1&&a<10?t.ccBits[0]:a<27?t.ccBits[1]:t.ccBits[2]},r.getBestModeForData=function(t){return i.testNumeric(t)?r.NUMERIC:i.testAlphanumeric(t)?r.ALPHANUMERIC:i.testKanji(t)?r.KANJI:r.BYTE},r.toString=function(t){if(t&&t.id)return t.id;throw new Error("Invalid mode")},r.isValid=function(t){return t&&t.bit&&t.ccBits};function n(o){if(typeof o!="string")throw new Error("Param is not a string");switch(o.toLowerCase()){case"numeric":return r.NUMERIC;case"alphanumeric":return r.ALPHANUMERIC;case"kanji":return r.KANJI;case"byte":return r.BYTE;default:throw new Error("Unknown mode: "+o)}}r.from=function(t,a){if(r.isValid(t))return t;try{return n(t)}catch{return a}}})(Ut)),Ut}var Ui;function no(){return Ui||(Ui=1,(function(r){const e=Te(),i=un(),n=pi(),o=Pe(),t=dn(),a=7973,s=e.getBCHDigit(a);function l(C,w,B){for(let y=1;y<=40;y++)if(w<=r.getCapacity(y,B,C))return y}function d(C,w){return o.getCharCountIndicator(C,w)+4}function p(C,w){let B=0;return C.forEach(function(y){const T=d(y.mode,w);B+=T+y.getBitsLength()}),B}function g(C,w){for(let B=1;B<=40;B++)if(p(C,B)<=r.getCapacity(B,w,o.MIXED))return B}r.from=function(w,B){return t.isValid(w)?parseInt(w,10):B},r.getCapacity=function(w,B,y){if(!t.isValid(w))throw new Error("Invalid QR Code version");typeof y>"u"&&(y=o.BYTE);const T=e.getSymbolTotalCodewords(w),b=i.getTotalCodewordsCount(w,B),f=(T-b)*8;if(y===o.MIXED)return f;const m=f-d(y,w);switch(y){case o.NUMERIC:return Math.floor(m/10*3);case o.ALPHANUMERIC:return Math.floor(m/11*2);case o.KANJI:return Math.floor(m/13);case o.BYTE:default:return Math.floor(m/8)}},r.getBestVersionForData=function(w,B){let y;const T=n.from(B,n.M);if(Array.isArray(w)){if(w.length>1)return g(w,T);if(w.length===0)return 1;y=w[0]}else y=w;return l(y.mode,y.getLength(),T)},r.getEncodedBits=function(w){if(!t.isValid(w)||w<7)throw new Error("Invalid QR Code version");let B=w<<12;for(;e.getBCHDigit(B)-s>=0;)B^=a<<e.getBCHDigit(B)-s;return w<<12|B}})(Mt)),Mt}var Vt={},qi;function oo(){if(qi)return Vt;qi=1;const r=Te(),e=1335,i=21522,n=r.getBCHDigit(e);return Vt.getEncodedBits=function(t,a){const s=t.bit<<3|a;let l=s<<10;for(;r.getBCHDigit(l)-n>=0;)l^=e<<r.getBCHDigit(l)-n;return(s<<10|l)^i},Vt}var Ft={},Kt,Vi;function ro(){if(Vi)return Kt;Vi=1;const r=Pe();function e(i){this.mode=r.NUMERIC,this.data=i.toString()}return e.getBitsLength=function(n){return 10*Math.floor(n/3)+(n%3?n%3*3+1:0)},e.prototype.getLength=function(){return this.data.length},e.prototype.getBitsLength=function(){return e.getBitsLength(this.data.length)},e.prototype.write=function(n){let o,t,a;for(o=0;o+3<=this.data.length;o+=3)t=this.data.substr(o,3),a=parseInt(t,10),n.put(a,10);const s=this.data.length-o;s>0&&(t=this.data.substr(o),a=parseInt(t,10),n.put(a,s*3+1))},Kt=e,Kt}var Ht,Fi;function ao(){if(Fi)return Ht;Fi=1;const r=Pe(),e=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function i(n){this.mode=r.ALPHANUMERIC,this.data=n}return i.getBitsLength=function(o){return 11*Math.floor(o/2)+6*(o%2)},i.prototype.getLength=function(){return this.data.length},i.prototype.getBitsLength=function(){return i.getBitsLength(this.data.length)},i.prototype.write=function(o){let t;for(t=0;t+2<=this.data.length;t+=2){let a=e.indexOf(this.data[t])*45;a+=e.indexOf(this.data[t+1]),o.put(a,11)}this.data.length%2&&o.put(e.indexOf(this.data[t]),6)},Ht=i,Ht}var Gt,Ki;function so(){if(Ki)return Gt;Ki=1;const r=Tn(),e=Pe();function i(n){this.mode=e.BYTE,typeof n=="string"&&(n=r(n)),this.data=new Uint8Array(n)}return i.getBitsLength=function(o){return o*8},i.prototype.getLength=function(){return this.data.length},i.prototype.getBitsLength=function(){return i.getBitsLength(this.data.length)},i.prototype.write=function(n){for(let o=0,t=this.data.length;o<t;o++)n.put(this.data[o],8)},Gt=i,Gt}var Yt,Hi;function lo(){if(Hi)return Yt;Hi=1;const r=Pe(),e=Te();function i(n){this.mode=r.KANJI,this.data=n}return i.getBitsLength=function(o){return o*13},i.prototype.getLength=function(){return this.data.length},i.prototype.getBitsLength=function(){return i.getBitsLength(this.data.length)},i.prototype.write=function(n){let o;for(o=0;o<this.data.length;o++){let t=e.toSJIS(this.data[o]);if(t>=33088&&t<=40956)t-=33088;else if(t>=57408&&t<=60351)t-=49472;else throw new Error("Invalid SJIS character: "+this.data[o]+`
Make sure your charset is UTF-8`);t=(t>>>8&255)*192+(t&255),n.put(t,13)}},Yt=i,Yt}var Gi;function co(){return Gi||(Gi=1,(function(r){const e=Pe(),i=ro(),n=ao(),o=so(),t=lo(),a=hn(),s=Te(),l=Sn();function d(b){return unescape(encodeURIComponent(b)).length}function p(b,f,m){const h=[];let k;for(;(k=b.exec(m))!==null;)h.push({data:k[0],index:k.index,mode:f,length:k[0].length});return h}function g(b){const f=p(a.NUMERIC,e.NUMERIC,b),m=p(a.ALPHANUMERIC,e.ALPHANUMERIC,b);let h,k;return s.isKanjiModeEnabled()?(h=p(a.BYTE,e.BYTE,b),k=p(a.KANJI,e.KANJI,b)):(h=p(a.BYTE_KANJI,e.BYTE,b),k=[]),f.concat(m,h,k).sort(function(_,I){return _.index-I.index}).map(function(_){return{data:_.data,mode:_.mode,length:_.length}})}function C(b,f){switch(f){case e.NUMERIC:return i.getBitsLength(b);case e.ALPHANUMERIC:return n.getBitsLength(b);case e.KANJI:return t.getBitsLength(b);case e.BYTE:return o.getBitsLength(b)}}function w(b){return b.reduce(function(f,m){const h=f.length-1>=0?f[f.length-1]:null;return h&&h.mode===m.mode?(f[f.length-1].data+=m.data,f):(f.push(m),f)},[])}function B(b){const f=[];for(let m=0;m<b.length;m++){const h=b[m];switch(h.mode){case e.NUMERIC:f.push([h,{data:h.data,mode:e.ALPHANUMERIC,length:h.length},{data:h.data,mode:e.BYTE,length:h.length}]);break;case e.ALPHANUMERIC:f.push([h,{data:h.data,mode:e.BYTE,length:h.length}]);break;case e.KANJI:f.push([h,{data:h.data,mode:e.BYTE,length:d(h.data)}]);break;case e.BYTE:f.push([{data:h.data,mode:e.BYTE,length:d(h.data)}])}}return f}function y(b,f){const m={},h={start:{}};let k=["start"];for(let x=0;x<b.length;x++){const _=b[x],I=[];for(let v=0;v<_.length;v++){const P=_[v],$=""+x+v;I.push($),m[$]={node:P,lastCount:0},h[$]={};for(let S=0;S<k.length;S++){const R=k[S];m[R]&&m[R].node.mode===P.mode?(h[R][$]=C(m[R].lastCount+P.length,P.mode)-C(m[R].lastCount,P.mode),m[R].lastCount+=P.length):(m[R]&&(m[R].lastCount=P.length),h[R][$]=C(P.length,P.mode)+4+e.getCharCountIndicator(P.mode,f))}}k=I}for(let x=0;x<k.length;x++)h[k[x]].end=0;return{map:h,table:m}}function T(b,f){let m;const h=e.getBestModeForData(b);if(m=e.from(f,h),m!==e.BYTE&&m.bit<h.bit)throw new Error('"'+b+'" cannot be encoded with mode '+e.toString(m)+`.
 Suggested mode is: `+e.toString(h));switch(m===e.KANJI&&!s.isKanjiModeEnabled()&&(m=e.BYTE),m){case e.NUMERIC:return new i(b);case e.ALPHANUMERIC:return new n(b);case e.KANJI:return new t(b);case e.BYTE:return new o(b)}}r.fromArray=function(f){return f.reduce(function(m,h){return typeof h=="string"?m.push(T(h,null)):h.data&&m.push(T(h.data,h.mode)),m},[])},r.fromString=function(f,m){const h=g(f,s.isKanjiModeEnabled()),k=B(h),x=y(k,m),_=l.find_path(x.map,"start","end"),I=[];for(let v=1;v<_.length-1;v++)I.push(x.table[_[v]].node);return r.fromArray(w(I))},r.rawSplit=function(f){return r.fromArray(g(f,s.isKanjiModeEnabled()))}})(Ft)),Ft}var Yi;function uo(){if(Yi)return Bt;Yi=1;const r=Te(),e=pi(),i=Yn(),n=Jn(),o=Qn(),t=Xn(),a=Zn(),s=un(),l=io(),d=no(),p=oo(),g=Pe(),C=co();function w(x,_){const I=x.size,v=t.getPositions(_);for(let P=0;P<v.length;P++){const $=v[P][0],S=v[P][1];for(let R=-1;R<=7;R++)if(!($+R<=-1||I<=$+R))for(let A=-1;A<=7;A++)S+A<=-1||I<=S+A||(R>=0&&R<=6&&(A===0||A===6)||A>=0&&A<=6&&(R===0||R===6)||R>=2&&R<=4&&A>=2&&A<=4?x.set($+R,S+A,!0,!0):x.set($+R,S+A,!1,!0))}}function B(x){const _=x.size;for(let I=8;I<_-8;I++){const v=I%2===0;x.set(I,6,v,!0),x.set(6,I,v,!0)}}function y(x,_){const I=o.getPositions(_);for(let v=0;v<I.length;v++){const P=I[v][0],$=I[v][1];for(let S=-2;S<=2;S++)for(let R=-2;R<=2;R++)S===-2||S===2||R===-2||R===2||S===0&&R===0?x.set(P+S,$+R,!0,!0):x.set(P+S,$+R,!1,!0)}}function T(x,_){const I=x.size,v=d.getEncodedBits(_);let P,$,S;for(let R=0;R<18;R++)P=Math.floor(R/3),$=R%3+I-8-3,S=(v>>R&1)===1,x.set(P,$,S,!0),x.set($,P,S,!0)}function b(x,_,I){const v=x.size,P=p.getEncodedBits(_,I);let $,S;for($=0;$<15;$++)S=(P>>$&1)===1,$<6?x.set($,8,S,!0):$<8?x.set($+1,8,S,!0):x.set(v-15+$,8,S,!0),$<8?x.set(8,v-$-1,S,!0):$<9?x.set(8,15-$-1+1,S,!0):x.set(8,15-$-1,S,!0);x.set(v-8,8,1,!0)}function f(x,_){const I=x.size;let v=-1,P=I-1,$=7,S=0;for(let R=I-1;R>0;R-=2)for(R===6&&R--;;){for(let A=0;A<2;A++)if(!x.isReserved(P,R-A)){let ve=!1;S<_.length&&(ve=(_[S]>>>$&1)===1),x.set(P,R-A,ve),$--,$===-1&&(S++,$=7)}if(P+=v,P<0||I<=P){P-=v,v=-v;break}}}function m(x,_,I){const v=new i;I.forEach(function(A){v.put(A.mode.bit,4),v.put(A.getLength(),g.getCharCountIndicator(A.mode,x)),A.write(v)});const P=r.getSymbolTotalCodewords(x),$=s.getTotalCodewordsCount(x,_),S=(P-$)*8;for(v.getLengthInBits()+4<=S&&v.put(0,4);v.getLengthInBits()%8!==0;)v.putBit(0);const R=(S-v.getLengthInBits())/8;for(let A=0;A<R;A++)v.put(A%2?17:236,8);return h(v,x,_)}function h(x,_,I){const v=r.getSymbolTotalCodewords(_),P=s.getTotalCodewordsCount(_,I),$=v-P,S=s.getBlocksCount(_,I),R=v%S,A=S-R,ve=Math.floor(v/S),ke=Math.floor($/S),yn=ke+1,mi=ve-ke,xn=new l(mi);let Et=0;const Ze=new Array(S),vi=new Array(S);let _t=0;const Cn=new Uint8Array(x.buffer);for(let Be=0;Be<S;Be++){const Wt=Be<A?ke:yn;Ze[Be]=Cn.slice(Et,Et+Wt),vi[Be]=xn.encode(Ze[Be]),Et+=Wt,_t=Math.max(_t,Wt)}const St=new Uint8Array(v);let yi=0,de,he;for(de=0;de<_t;de++)for(he=0;he<S;he++)de<Ze[he].length&&(St[yi++]=Ze[he][de]);for(de=0;de<mi;de++)for(he=0;he<S;he++)St[yi++]=vi[he][de];return St}function k(x,_,I,v){let P;if(Array.isArray(x))P=C.fromArray(x);else if(typeof x=="string"){let ve=_;if(!ve){const ke=C.rawSplit(x);ve=d.getBestVersionForData(ke,I)}P=C.fromString(x,ve||40)}else throw new Error("Invalid data");const $=d.getBestVersionForData(P,I);if(!$)throw new Error("The amount of data is too big to be stored in a QR Code");if(!_)_=$;else if(_<$)throw new Error(`
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: `+$+`.
`);const S=m(_,I,P),R=r.getSymbolSize(_),A=new n(R);return w(A,_),B(A),y(A,_),b(A,I,0),_>=7&&T(A,_),f(A,S),isNaN(v)&&(v=a.getBestMask(A,b.bind(null,A,I))),a.applyMask(v,A),b(A,I,v),{modules:A,version:_,errorCorrectionLevel:I,maskPattern:v,segments:P}}return Bt.create=function(_,I){if(typeof _>"u"||_==="")throw new Error("No input text");let v=e.M,P,$;return typeof I<"u"&&(v=e.from(I.errorCorrectionLevel,e.M),P=d.from(I.version),$=a.from(I.maskPattern),I.toSJISFunc&&r.setToSJISFunction(I.toSJISFunc)),k(_,P,v,$)},Bt}var Jt={},Qt={},Ji;function fn(){return Ji||(Ji=1,(function(r){function e(i){if(typeof i=="number"&&(i=i.toString()),typeof i!="string")throw new Error("Color should be defined as hex string");let n=i.slice().replace("#","").split("");if(n.length<3||n.length===5||n.length>8)throw new Error("Invalid hex color: "+i);(n.length===3||n.length===4)&&(n=Array.prototype.concat.apply([],n.map(function(t){return[t,t]}))),n.length===6&&n.push("F","F");const o=parseInt(n.join(""),16);return{r:o>>24&255,g:o>>16&255,b:o>>8&255,a:o&255,hex:"#"+n.slice(0,6).join("")}}r.getOptions=function(n){n||(n={}),n.color||(n.color={});const o=typeof n.margin>"u"||n.margin===null||n.margin<0?4:n.margin,t=n.width&&n.width>=21?n.width:void 0,a=n.scale||4;return{width:t,scale:t?4:a,margin:o,color:{dark:e(n.color.dark||"#000000ff"),light:e(n.color.light||"#ffffffff")},type:n.type,rendererOpts:n.rendererOpts||{}}},r.getScale=function(n,o){return o.width&&o.width>=n+o.margin*2?o.width/(n+o.margin*2):o.scale},r.getImageWidth=function(n,o){const t=r.getScale(n,o);return Math.floor((n+o.margin*2)*t)},r.qrToImageData=function(n,o,t){const a=o.modules.size,s=o.modules.data,l=r.getScale(a,t),d=Math.floor((a+t.margin*2)*l),p=t.margin*l,g=[t.color.light,t.color.dark];for(let C=0;C<d;C++)for(let w=0;w<d;w++){let B=(C*d+w)*4,y=t.color.light;if(C>=p&&w>=p&&C<d-p&&w<d-p){const T=Math.floor((C-p)/l),b=Math.floor((w-p)/l);y=g[s[T*a+b]?1:0]}n[B++]=y.r,n[B++]=y.g,n[B++]=y.b,n[B]=y.a}}})(Qt)),Qt}var Qi;function ho(){return Qi||(Qi=1,(function(r){const e=fn();function i(o,t,a){o.clearRect(0,0,t.width,t.height),t.style||(t.style={}),t.height=a,t.width=a,t.style.height=a+"px",t.style.width=a+"px"}function n(){try{return document.createElement("canvas")}catch{throw new Error("You need to specify a canvas element")}}r.render=function(t,a,s){let l=s,d=a;typeof l>"u"&&(!a||!a.getContext)&&(l=a,a=void 0),a||(d=n()),l=e.getOptions(l);const p=e.getImageWidth(t.modules.size,l),g=d.getContext("2d"),C=g.createImageData(p,p);return e.qrToImageData(C.data,t,l),i(g,d,p),g.putImageData(C,0,0),d},r.renderToDataURL=function(t,a,s){let l=s;typeof l>"u"&&(!a||!a.getContext)&&(l=a,a=void 0),l||(l={});const d=r.render(t,a,l),p=l.type||"image/png",g=l.rendererOpts||{};return d.toDataURL(p,g.quality)}})(Jt)),Jt}var Xt={},Xi;function fo(){if(Xi)return Xt;Xi=1;const r=fn();function e(o,t){const a=o.a/255,s=t+'="'+o.hex+'"';return a<1?s+" "+t+'-opacity="'+a.toFixed(2).slice(1)+'"':s}function i(o,t,a){let s=o+t;return typeof a<"u"&&(s+=" "+a),s}function n(o,t,a){let s="",l=0,d=!1,p=0;for(let g=0;g<o.length;g++){const C=Math.floor(g%t),w=Math.floor(g/t);!C&&!d&&(d=!0),o[g]?(p++,g>0&&C>0&&o[g-1]||(s+=d?i("M",C+a,.5+w+a):i("m",l,0),l=0,d=!1),C+1<t&&o[g+1]||(s+=i("h",p),p=0)):l++}return s}return Xt.render=function(t,a,s){const l=r.getOptions(a),d=t.modules.size,p=t.modules.data,g=d+l.margin*2,C=l.color.light.a?"<path "+e(l.color.light,"fill")+' d="M0 0h'+g+"v"+g+'H0z"/>':"",w="<path "+e(l.color.dark,"stroke")+' d="'+n(p,d,l.margin)+'"/>',B='viewBox="0 0 '+g+" "+g+'"',T='<svg xmlns="http://www.w3.org/2000/svg" '+(l.width?'width="'+l.width+'" height="'+l.width+'" ':"")+B+' shape-rendering="crispEdges">'+C+w+`</svg>
`;return typeof s=="function"&&s(null,T),T},Xt}var Zi;function po(){if(Zi)return Le;Zi=1;const r=Gn(),e=uo(),i=ho(),n=fo();function o(t,a,s,l,d){const p=[].slice.call(arguments,1),g=p.length,C=typeof p[g-1]=="function";if(!C&&!r())throw new Error("Callback required as last argument");if(C){if(g<2)throw new Error("Too few arguments provided");g===2?(d=s,s=a,a=l=void 0):g===3&&(a.getContext&&typeof d>"u"?(d=l,l=void 0):(d=l,l=s,s=a,a=void 0))}else{if(g<1)throw new Error("Too few arguments provided");return g===1?(s=a,a=l=void 0):g===2&&!a.getContext&&(l=s,s=a,a=void 0),new Promise(function(w,B){try{const y=e.create(s,l);w(t(y,a,l))}catch(y){B(y)}})}try{const w=e.create(s,l);d(null,t(w,a,l))}catch(w){d(w)}}return Le.create=e.create,Le.toCanvas=o.bind(null,i.render),Le.toDataURL=o.bind(null,i.renderToDataURL),Le.toString=o.bind(null,function(t,a,s){return n.render(t,s)}),Le}var go=po();const wo=Wn(go),bo=.1,en=2.5,fe=7;function Zt(r,e,i){return r===e?!1:(r-e<0?e-r:r-e)<=i+bo}function mo(r,e){const i=Array.prototype.slice.call(wo.create(r,{errorCorrectionLevel:e}).modules.data,0),n=Math.sqrt(i.length);return i.reduce((o,t,a)=>(a%n===0?o.push([t]):o[o.length-1].push(t))&&o,[])}const vo={generate({uri:r,size:e,logoSize:i,dotColor:n="#141414"}){const o="transparent",a=[],s=mo(r,"Q"),l=e/s.length,d=[{x:0,y:0},{x:1,y:0},{x:0,y:1}];d.forEach(({x:y,y:T})=>{const b=(s.length-fe)*l*y,f=(s.length-fe)*l*T,m=.45;for(let h=0;h<d.length;h+=1){const k=l*(fe-h*2);a.push(Me`
            <rect
              fill=${h===2?n:o}
              width=${h===0?k-5:k}
              rx= ${h===0?(k-5)*m:k*m}
              ry= ${h===0?(k-5)*m:k*m}
              stroke=${n}
              stroke-width=${h===0?5:0}
              height=${h===0?k-5:k}
              x= ${h===0?f+l*h+5/2:f+l*h}
              y= ${h===0?b+l*h+5/2:b+l*h}
            />
          `)}});const p=Math.floor((i+25)/l),g=s.length/2-p/2,C=s.length/2+p/2-1,w=[];s.forEach((y,T)=>{y.forEach((b,f)=>{if(s[T][f]&&!(T<fe&&f<fe||T>s.length-(fe+1)&&f<fe||T<fe&&f>s.length-(fe+1))&&!(T>g&&T<C&&f>g&&f<C)){const m=T*l+l/2,h=f*l+l/2;w.push([m,h])}})});const B={};return w.forEach(([y,T])=>{var b;B[y]?(b=B[y])==null||b.push(T):B[y]=[T]}),Object.entries(B).map(([y,T])=>{const b=T.filter(f=>T.every(m=>!Zt(f,m,l)));return[Number(y),b]}).forEach(([y,T])=>{T.forEach(b=>{a.push(Me`<circle cx=${y} cy=${b} fill=${n} r=${l/en} />`)})}),Object.entries(B).filter(([y,T])=>T.length>1).map(([y,T])=>{const b=T.filter(f=>T.some(m=>Zt(f,m,l)));return[Number(y),b]}).map(([y,T])=>{T.sort((f,m)=>f<m?-1:1);const b=[];for(const f of T){const m=b.find(h=>h.some(k=>Zt(f,k,l)));m?m.push(f):b.push([f])}return[y,b.map(f=>[f[0],f[f.length-1]])]}).forEach(([y,T])=>{T.forEach(([b,f])=>{a.push(Me`
              <line
                x1=${y}
                x2=${y}
                y1=${b}
                y2=${f}
                stroke=${n}
                stroke-width=${l/(en/2)}
                stroke-linecap="round"
              />
            `)})}),a}},yo=q`
  :host {
    position: relative;
    user-select: none;
    display: block;
    overflow: hidden;
    aspect-ratio: 1 / 1;
    width: var(--local-size);
  }

  :host([data-theme='dark']) {
    border-radius: clamp(0px, var(--wui-border-radius-l), 40px);
    background-color: var(--wui-color-inverse-100);
    padding: var(--wui-spacing-l);
  }

  :host([data-theme='light']) {
    box-shadow: 0 0 0 1px var(--wui-color-bg-125);
    background-color: var(--wui-color-bg-125);
  }

  :host([data-clear='true']) > wui-icon {
    display: none;
  }

  svg:first-child,
  wui-image,
  wui-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateY(-50%) translateX(-50%);
  }

  wui-image {
    width: 25%;
    height: 25%;
    border-radius: var(--wui-border-radius-xs);
  }

  wui-icon {
    width: 100%;
    height: 100%;
    color: var(--local-icon-color) !important;
    transform: translateY(-50%) translateX(-50%) scale(0.25);
  }
`;var me=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};const xo="#3396ff";let oe=class extends V{constructor(){super(...arguments),this.uri="",this.size=0,this.theme="dark",this.imageSrc=void 0,this.alt=void 0,this.arenaClear=void 0,this.farcaster=void 0}render(){return this.dataset.theme=this.theme,this.dataset.clear=String(this.arenaClear),this.style.cssText=`
     --local-size: ${this.size}px;
     --local-icon-color: ${this.color??xo}
    `,E`${this.templateVisual()} ${this.templateSvg()}`}templateSvg(){const e=this.theme==="light"?this.size:this.size-32;return Me`
      <svg height=${e} width=${e}>
        ${vo.generate({uri:this.uri,size:e,logoSize:this.arenaClear?0:e/4,dotColor:this.color})}
      </svg>
    `}templateVisual(){return this.imageSrc?E`<wui-image src=${this.imageSrc} alt=${this.alt??"logo"}></wui-image>`:this.farcaster?E`<wui-icon
        class="farcaster"
        size="inherit"
        color="inherit"
        name="farcaster"
      ></wui-icon>`:E`<wui-icon size="inherit" color="inherit" name="walletConnect"></wui-icon>`}};oe.styles=[K,yo];me([c()],oe.prototype,"uri",void 0);me([c({type:Number})],oe.prototype,"size",void 0);me([c()],oe.prototype,"theme",void 0);me([c()],oe.prototype,"imageSrc",void 0);me([c()],oe.prototype,"alt",void 0);me([c()],oe.prototype,"color",void 0);me([c({type:Boolean})],oe.prototype,"arenaClear",void 0);me([c({type:Boolean})],oe.prototype,"farcaster",void 0);oe=me([W("wui-qr-code")],oe);const Co=q`
  :host {
    display: block;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
    background: linear-gradient(
      120deg,
      var(--wui-color-bg-200) 5%,
      var(--wui-color-bg-200) 48%,
      var(--wui-color-bg-300) 55%,
      var(--wui-color-bg-300) 60%,
      var(--wui-color-bg-300) calc(60% + 10px),
      var(--wui-color-bg-200) calc(60% + 12px),
      var(--wui-color-bg-200) 100%
    );
    background-size: 250%;
    animation: shimmer 3s linear infinite reverse;
  }

  :host([variant='light']) {
    background: linear-gradient(
      120deg,
      var(--wui-color-bg-150) 5%,
      var(--wui-color-bg-150) 48%,
      var(--wui-color-bg-200) 55%,
      var(--wui-color-bg-200) 60%,
      var(--wui-color-bg-200) calc(60% + 10px),
      var(--wui-color-bg-150) calc(60% + 12px),
      var(--wui-color-bg-150) 100%
    );
    background-size: 250%;
  }

  @keyframes shimmer {
    from {
      background-position: -250% 0;
    }
    to {
      background-position: 250% 0;
    }
  }
`;var Je=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let Re=class extends V{constructor(){super(...arguments),this.width="",this.height="",this.borderRadius="m",this.variant="default"}render(){return this.style.cssText=`
      width: ${this.width};
      height: ${this.height};
      border-radius: ${`clamp(0px,var(--wui-border-radius-${this.borderRadius}), 40px)`};
    `,E`<slot></slot>`}};Re.styles=[Co];Je([c()],Re.prototype,"width",void 0);Je([c()],Re.prototype,"height",void 0);Je([c()],Re.prototype,"borderRadius",void 0);Je([c()],Re.prototype,"variant",void 0);Re=Je([W("wui-shimmer")],Re);const $o=q`
  .reown-logo {
    height: var(--wui-spacing-xxl);
  }
`;var Ro=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let ni=class extends V{render(){return E`
      <wui-flex
        justifyContent="center"
        alignItems="center"
        gap="xs"
        .padding=${["0","0","l","0"]}
      >
        <wui-text variant="small-500" color="fg-100"> UX by </wui-text>
        <wui-icon name="reown" size="xxxl" class="reown-logo"></wui-icon>
      </wui-flex>
    `}};ni.styles=[K,Q,$o];ni=Ro([W("wui-ux-by-reown")],ni);const Io=_e`
  @keyframes fadein {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  wui-shimmer {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: clamp(0px, var(--wui-border-radius-l), 40px) !important;
  }

  wui-qr-code {
    opacity: 0;
    animation-duration: 200ms;
    animation-timing-function: ease;
    animation-name: fadein;
    animation-fill-mode: forwards;
  }
`;var Eo=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let oi=class extends H{constructor(){var e;super(),this.forceUpdate=()=>{this.requestUpdate()},window.addEventListener("resize",this.forceUpdate),ne.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:((e=this.wallet)==null?void 0:e.name)??"WalletConnect",platform:"qrcode"}})}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this.unsubscribe)==null||e.forEach(i=>i()),window.removeEventListener("resize",this.forceUpdate)}render(){return this.onRenderProxy(),u`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["0","xl","xl","xl"]}
        gap="xl"
      >
        <wui-shimmer borderRadius="l" width="100%"> ${this.qrCodeTemplate()} </wui-shimmer>

        <wui-text variant="paragraph-500" color="fg-100">
          Scan this QR Code with your phone
        </wui-text>
        ${this.copyTemplate()}
      </wui-flex>
      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}onRenderProxy(){!this.ready&&this.uri&&(this.timeout=setTimeout(()=>{this.ready=!0},200))}qrCodeTemplate(){if(!this.uri||!this.ready)return null;const e=this.getBoundingClientRect().width-40,i=this.wallet?this.wallet.name:void 0;return z.setWcLinking(void 0),z.setRecentWallet(this.wallet),u` <wui-qr-code
      size=${e}
      theme=${ii.state.themeMode}
      uri=${this.uri}
      imageSrc=${j(Y.getWalletImage(this.wallet))}
      color=${j(ii.state.themeVariables["--w3m-qr-color"])}
      alt=${j(i)}
      data-testid="wui-qr-code"
    ></wui-qr-code>`}copyTemplate(){const e=!this.uri||!this.ready;return u`<wui-link
      .disabled=${e}
      @click=${this.onCopyUri}
      color="fg-200"
      data-testid="copy-wc2-uri"
    >
      <wui-icon size="xs" color="fg-200" slot="iconLeft" name="copy"></wui-icon>
      Copy link
    </wui-link>`}};oi.styles=Io;oi=Eo([W("w3m-connecting-wc-qrcode")],oi);var _o=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let tn=class extends U{constructor(){var e;if(super(),this.wallet=(e=F.state.data)==null?void 0:e.wallet,!this.wallet)throw new Error("w3m-connecting-wc-unsupported: No wallet provided");ne.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser"}})}render(){return u`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["3xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-wallet-image
          size="lg"
          imageSrc=${j(Y.getWalletImage(this.wallet))}
        ></wui-wallet-image>

        <wui-text variant="paragraph-500" color="fg-100">Not Detected</wui-text>
      </wui-flex>

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}};tn=_o([W("w3m-connecting-wc-unsupported")],tn);var pn=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let ri=class extends H{constructor(){if(super(),this.isLoading=!0,!this.wallet)throw new Error("w3m-connecting-wc-web: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.secondaryBtnLabel="Open",this.secondaryLabel="Open and continue in a new browser tab",this.secondaryBtnIcon="externalLink",this.updateLoadingState(),this.unsubscribe.push(z.subscribeKey("wcUri",()=>{this.updateLoadingState()})),ne.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"web"}})}updateLoadingState(){this.isLoading=!this.uri}onConnectProxy(){var e;if((e=this.wallet)!=null&&e.webapp_link&&this.uri)try{this.error=!1;const{webapp_link:i,name:n}=this.wallet,{redirect:o,href:t}=L.formatUniversalUrl(i,this.uri);z.setWcLinking({name:n,href:t}),z.setRecentWallet(this.wallet),L.openHref(o,"_blank")}catch{this.error=!0}}};pn([O()],ri.prototype,"isLoading",void 0);ri=pn([W("w3m-connecting-wc-web")],ri);var Rt=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let He=class extends U{constructor(){var e;super(),this.wallet=(e=F.state.data)==null?void 0:e.wallet,this.platform=void 0,this.platforms=[],this.isSiwxEnabled=!!Ce.state.siwx,this.determinePlatforms(),this.initializeConnection()}render(){return u`
      ${this.headerTemplate()}
      <div>${this.platformTemplate()}</div>
      <wui-ux-by-reown></wui-ux-by-reown>
    `}async initializeConnection(e=!1){if(!(this.platform==="browser"||Ce.state.manualWCControl&&!e))try{const{wcPairingExpiry:i,status:n}=z.state;(e||L.isPairingExpired(i)||n==="connecting")&&(await z.connectWalletConnect(),this.isSiwxEnabled||rn.close())}catch(i){ne.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:(i==null?void 0:i.message)??"Unknown"}}),z.setWcError(!0),it.showError(i.message??"Connection error"),z.resetWcConnection(),F.goBack()}}determinePlatforms(){if(!this.wallet){this.platforms.push("qrcode"),this.platform="qrcode";return}if(this.platform)return;const{mobile_link:e,desktop_link:i,webapp_link:n,injected:o,rdns:t}=this.wallet,a=o==null?void 0:o.map(({injected_id:B})=>B).filter(Boolean),s=[...t?[t]:a??[]],l=Ce.state.isUniversalProvider?!1:s.length,d=e,p=n,g=z.checkInstalled(s),C=l&&g,w=i&&!L.isMobile();C&&!Ci.state.noAdapters&&this.platforms.push("browser"),d&&this.platforms.push(L.isMobile()?"mobile":"qrcode"),p&&this.platforms.push("web"),w&&this.platforms.push("desktop"),!C&&l&&!Ci.state.noAdapters&&this.platforms.push("unsupported"),this.platform=this.platforms[0]}platformTemplate(){switch(this.platform){case"browser":return u`<w3m-connecting-wc-browser></w3m-connecting-wc-browser>`;case"web":return u`<w3m-connecting-wc-web></w3m-connecting-wc-web>`;case"desktop":return u`
          <w3m-connecting-wc-desktop .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-desktop>
        `;case"mobile":return u`
          <w3m-connecting-wc-mobile isMobile .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-mobile>
        `;case"qrcode":return u`<w3m-connecting-wc-qrcode></w3m-connecting-wc-qrcode>`;default:return u`<w3m-connecting-wc-unsupported></w3m-connecting-wc-unsupported>`}}headerTemplate(){return this.platforms.length>1?u`
      <w3m-connecting-header
        .platforms=${this.platforms}
        .onSelectPlatfrom=${this.onSelectPlatform.bind(this)}
      >
      </w3m-connecting-header>
    `:null}async onSelectPlatform(e){var n;const i=(n=this.shadowRoot)==null?void 0:n.querySelector("div");i&&(await i.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.platform=e,i.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}};Rt([O()],He.prototype,"platform",void 0);Rt([O()],He.prototype,"platforms",void 0);Rt([O()],He.prototype,"isSiwxEnabled",void 0);He=Rt([W("w3m-connecting-wc-view")],He);var gn=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let ai=class extends U{constructor(){super(...arguments),this.isMobile=L.isMobile()}render(){if(this.isMobile){const{featured:e,recommended:i}=N.state,{customWallets:n}=Ce.state,o=wt.getRecentWallets(),t=e.length||i.length||(n==null?void 0:n.length)||o.length;return u`<wui-flex
        flexDirection="column"
        gap="xs"
        .margin=${["3xs","s","s","s"]}
      >
        ${t?u`<w3m-connector-list></w3m-connector-list>`:null}
        <w3m-all-wallets-widget></w3m-all-wallets-widget>
      </wui-flex>`}return u`<wui-flex flexDirection="column" .padding=${["0","0","l","0"]}>
      <w3m-connecting-wc-view></w3m-connecting-wc-view>
      <wui-flex flexDirection="column" .padding=${["0","m","0","m"]}>
        <w3m-all-wallets-widget></w3m-all-wallets-widget> </wui-flex
    ></wui-flex>`}};gn([O()],ai.prototype,"isMobile",void 0);ai=gn([W("w3m-connecting-wc-basic-view")],ai);/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const gi=()=>new So;class So{}const ei=new WeakMap,wi=$n(class extends Rn{render(r){return ti}update(r,[e]){var n;const i=e!==this.G;return i&&this.rt(void 0),(i||this.lt!==this.ct)&&(this.G=e,this.ht=(n=r.options)==null?void 0:n.host,this.rt(this.ct=r.element)),ti}rt(r){if(this.G!==void 0)if(this.isConnected||(r=void 0),typeof this.G=="function"){const e=this.ht??globalThis;let i=ei.get(e);i===void 0&&(i=new WeakMap,ei.set(e,i)),i.get(this.G)!==void 0&&this.G.call(this.ht,void 0),i.set(this.G,r),r!==void 0&&this.G.call(this.ht,r)}else this.G.value=r}get lt(){var r,e;return typeof this.G=="function"?(r=ei.get(this.ht??globalThis))==null?void 0:r.get(this.G):(e=this.G)==null?void 0:e.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}}),Wo=q`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  label {
    position: relative;
    display: inline-block;
    width: 32px;
    height: 22px;
  }

  input {
    width: 0;
    height: 0;
    opacity: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--wui-color-blue-100);
    border-width: 1px;
    border-style: solid;
    border-color: var(--wui-color-gray-glass-002);
    border-radius: 999px;
    transition:
      background-color var(--wui-ease-inout-power-1) var(--wui-duration-md),
      border-color var(--wui-ease-inout-power-1) var(--wui-duration-md);
    will-change: background-color, border-color;
  }

  span:before {
    position: absolute;
    content: '';
    height: 16px;
    width: 16px;
    left: 3px;
    top: 2px;
    background-color: var(--wui-color-inverse-100);
    transition: transform var(--wui-ease-inout-power-1) var(--wui-duration-lg);
    will-change: transform;
    border-radius: 50%;
  }

  input:checked + span {
    border-color: var(--wui-color-gray-glass-005);
    background-color: var(--wui-color-blue-100);
  }

  input:not(:checked) + span {
    background-color: var(--wui-color-gray-glass-010);
  }

  input:checked + span:before {
    transform: translateX(calc(100% - 7px));
  }
`;var wn=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let dt=class extends V{constructor(){super(...arguments),this.inputElementRef=gi(),this.checked=void 0}render(){return E`
      <label>
        <input
          ${wi(this.inputElementRef)}
          type="checkbox"
          ?checked=${ge(this.checked)}
          @change=${this.dispatchChangeEvent.bind(this)}
        />
        <span></span>
      </label>
    `}dispatchChangeEvent(){var e;this.dispatchEvent(new CustomEvent("switchChange",{detail:(e=this.inputElementRef.value)==null?void 0:e.checked,bubbles:!0,composed:!0}))}};dt.styles=[K,Q,_n,Wo];wn([c({type:Boolean})],dt.prototype,"checked",void 0);dt=wn([W("wui-switch")],dt);const To=q`
  :host {
    height: 100%;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    column-gap: var(--wui-spacing-1xs);
    padding: var(--wui-spacing-xs) var(--wui-spacing-s);
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    transition: background-color var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color;
    cursor: pointer;
  }

  wui-switch {
    pointer-events: none;
  }
`;var bn=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let ht=class extends V{constructor(){super(...arguments),this.checked=void 0}render(){return E`
      <button>
        <wui-icon size="xl" name="walletConnectBrown"></wui-icon>
        <wui-switch ?checked=${ge(this.checked)}></wui-switch>
      </button>
    `}};ht.styles=[K,Q,To];bn([c({type:Boolean})],ht.prototype,"checked",void 0);ht=bn([W("wui-certified-switch")],ht);const Po=q`
  button {
    background-color: var(--wui-color-fg-300);
    border-radius: var(--wui-border-radius-4xs);
    width: 16px;
    height: 16px;
  }

  button:disabled {
    background-color: var(--wui-color-bg-300);
  }

  wui-icon {
    color: var(--wui-color-bg-200) !important;
  }

  button:focus-visible {
    background-color: var(--wui-color-fg-250);
    border: 1px solid var(--wui-color-accent-100);
  }

  @media (hover: hover) and (pointer: fine) {
    button:hover:enabled {
      background-color: var(--wui-color-fg-250);
    }

    button:active:enabled {
      background-color: var(--wui-color-fg-225);
    }
  }
`;var mn=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let ft=class extends V{constructor(){super(...arguments),this.icon="copy"}render(){return E`
      <button>
        <wui-icon color="inherit" size="xxs" name=${this.icon}></wui-icon>
      </button>
    `}};ft.styles=[K,Q,Po];mn([c()],ft.prototype,"icon",void 0);ft=mn([W("wui-input-element")],ft);const Bo=q`
  :host {
    position: relative;
    width: 100%;
    display: inline-block;
    color: var(--wui-color-fg-275);
  }

  input {
    width: 100%;
    border-radius: var(--wui-border-radius-xs);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    background: var(--wui-color-gray-glass-002);
    font-size: var(--wui-font-size-paragraph);
    letter-spacing: var(--wui-letter-spacing-paragraph);
    color: var(--wui-color-fg-100);
    transition:
      background-color var(--wui-ease-inout-power-1) var(--wui-duration-md),
      border-color var(--wui-ease-inout-power-1) var(--wui-duration-md),
      box-shadow var(--wui-ease-inout-power-1) var(--wui-duration-md);
    will-change: background-color, border-color, box-shadow;
    caret-color: var(--wui-color-accent-100);
  }

  input:disabled {
    cursor: not-allowed;
    border: 1px solid var(--wui-color-gray-glass-010);
  }

  input:disabled::placeholder,
  input:disabled + wui-icon {
    color: var(--wui-color-fg-300);
  }

  input::placeholder {
    color: var(--wui-color-fg-275);
  }

  input:focus:enabled {
    background-color: var(--wui-color-gray-glass-005);
    -webkit-box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0px 0px 0px 4px var(--wui-box-shadow-blue);
    -moz-box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0px 0px 0px 4px var(--wui-box-shadow-blue);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0px 0px 0px 4px var(--wui-box-shadow-blue);
  }

  input:hover:enabled {
    background-color: var(--wui-color-gray-glass-005);
  }

  wui-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .wui-size-sm {
    padding: 9px var(--wui-spacing-m) 10px var(--wui-spacing-s);
  }

  wui-icon + .wui-size-sm {
    padding: 9px var(--wui-spacing-m) 10px 36px;
  }

  wui-icon[data-input='sm'] {
    left: var(--wui-spacing-s);
  }

  .wui-size-md {
    padding: 15px var(--wui-spacing-m) var(--wui-spacing-l) var(--wui-spacing-m);
  }

  wui-icon + .wui-size-md,
  wui-loading-spinner + .wui-size-md {
    padding: 10.5px var(--wui-spacing-3xl) 10.5px var(--wui-spacing-3xl);
  }

  wui-icon[data-input='md'] {
    left: var(--wui-spacing-l);
  }

  .wui-size-lg {
    padding: var(--wui-spacing-s) var(--wui-spacing-s) var(--wui-spacing-s) var(--wui-spacing-l);
    letter-spacing: var(--wui-letter-spacing-medium-title);
    font-size: var(--wui-font-size-medium-title);
    font-weight: var(--wui-font-weight-light);
    line-height: 130%;
    color: var(--wui-color-fg-100);
    height: 64px;
  }

  .wui-padding-right-xs {
    padding-right: var(--wui-spacing-xs);
  }

  .wui-padding-right-s {
    padding-right: var(--wui-spacing-s);
  }

  .wui-padding-right-m {
    padding-right: var(--wui-spacing-m);
  }

  .wui-padding-right-l {
    padding-right: var(--wui-spacing-l);
  }

  .wui-padding-right-xl {
    padding-right: var(--wui-spacing-xl);
  }

  .wui-padding-right-2xl {
    padding-right: var(--wui-spacing-2xl);
  }

  .wui-padding-right-3xl {
    padding-right: var(--wui-spacing-3xl);
  }

  .wui-padding-right-4xl {
    padding-right: var(--wui-spacing-4xl);
  }

  .wui-padding-right-5xl {
    padding-right: var(--wui-spacing-5xl);
  }

  wui-icon + .wui-size-lg,
  wui-loading-spinner + .wui-size-lg {
    padding-left: 50px;
  }

  wui-icon[data-input='lg'] {
    left: var(--wui-spacing-l);
  }

  .wui-size-mdl {
    padding: 17.25px var(--wui-spacing-m) 17.25px var(--wui-spacing-m);
  }
  wui-icon + .wui-size-mdl,
  wui-loading-spinner + .wui-size-mdl {
    padding: 17.25px var(--wui-spacing-3xl) 17.25px 40px;
  }
  wui-icon[data-input='mdl'] {
    left: var(--wui-spacing-m);
  }

  input:placeholder-shown ~ ::slotted(wui-input-element),
  input:placeholder-shown ~ ::slotted(wui-icon) {
    opacity: 0;
    pointer-events: none;
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type='number'] {
    -moz-appearance: textfield;
  }

  ::slotted(wui-input-element),
  ::slotted(wui-icon) {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }

  ::slotted(wui-input-element) {
    right: var(--wui-spacing-m);
  }

  ::slotted(wui-icon) {
    right: 0px;
  }
`;var ue=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let te=class extends V{constructor(){super(...arguments),this.inputElementRef=gi(),this.size="md",this.disabled=!1,this.placeholder="",this.type="text",this.value=""}render(){const e=`wui-padding-right-${this.inputRightPadding}`,n={[`wui-size-${this.size}`]:!0,[e]:!!this.inputRightPadding};return E`${this.templateIcon()}
      <input
        data-testid="wui-input-text"
        ${wi(this.inputElementRef)}
        class=${In(n)}
        type=${this.type}
        enterkeyhint=${ge(this.enterKeyHint)}
        ?disabled=${this.disabled}
        placeholder=${this.placeholder}
        @input=${this.dispatchInputChangeEvent.bind(this)}
        .value=${this.value||""}
        tabindex=${ge(this.tabIdx)}
      />
      <slot></slot>`}templateIcon(){return this.icon?E`<wui-icon
        data-input=${this.size}
        size=${this.size}
        color="inherit"
        name=${this.icon}
      ></wui-icon>`:null}dispatchInputChangeEvent(){var e;this.dispatchEvent(new CustomEvent("inputChange",{detail:(e=this.inputElementRef.value)==null?void 0:e.value,bubbles:!0,composed:!0}))}};te.styles=[K,Q,Bo];ue([c()],te.prototype,"size",void 0);ue([c()],te.prototype,"icon",void 0);ue([c({type:Boolean})],te.prototype,"disabled",void 0);ue([c()],te.prototype,"placeholder",void 0);ue([c()],te.prototype,"type",void 0);ue([c()],te.prototype,"keyHint",void 0);ue([c()],te.prototype,"value",void 0);ue([c()],te.prototype,"inputRightPadding",void 0);ue([c()],te.prototype,"tabIdx",void 0);te=ue([W("wui-input-text")],te);const Lo=q`
  :host {
    position: relative;
    display: inline-block;
    width: 100%;
  }
`;var Oo=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let si=class extends V{constructor(){super(...arguments),this.inputComponentRef=gi()}render(){return E`
      <wui-input-text
        ${wi(this.inputComponentRef)}
        placeholder="Search wallet"
        icon="search"
        type="search"
        enterKeyHint="search"
        size="sm"
      >
        <wui-input-element @click=${this.clearValue} icon="close"></wui-input-element>
      </wui-input-text>
    `}clearValue(){const e=this.inputComponentRef.value,i=e==null?void 0:e.inputElementRef.value;i&&(i.value="",i.focus(),i.dispatchEvent(new Event("input")))}};si.styles=[K,Lo];si=Oo([W("wui-search-bar")],si);const Ao=Me`<svg  viewBox="0 0 48 54" fill="none">
  <path
    d="M43.4605 10.7248L28.0485 1.61089C25.5438 0.129705 22.4562 0.129705 19.9515 1.61088L4.53951 10.7248C2.03626 12.2051 0.5 14.9365 0.5 17.886V36.1139C0.5 39.0635 2.03626 41.7949 4.53951 43.2752L19.9515 52.3891C22.4562 53.8703 25.5438 53.8703 28.0485 52.3891L43.4605 43.2752C45.9637 41.7949 47.5 39.0635 47.5 36.114V17.8861C47.5 14.9365 45.9637 12.2051 43.4605 10.7248Z"
  />
</svg>`,jo=q`
  :host {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 104px;
    row-gap: var(--wui-spacing-xs);
    padding: var(--wui-spacing-xs) 10px;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: clamp(0px, var(--wui-border-radius-xs), 20px);
    position: relative;
  }

  wui-shimmer[data-type='network'] {
    border: none;
    -webkit-clip-path: var(--wui-path-network);
    clip-path: var(--wui-path-network);
  }

  svg {
    position: absolute;
    width: 48px;
    height: 54px;
    z-index: 1;
  }

  svg > path {
    stroke: var(--wui-color-gray-glass-010);
    stroke-width: 1px;
  }

  @media (max-width: 350px) {
    :host {
      width: 100%;
    }
  }
`;var vn=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let pt=class extends V{constructor(){super(...arguments),this.type="wallet"}render(){return E`
      ${this.shimmerTemplate()}
      <wui-shimmer width="56px" height="20px" borderRadius="xs"></wui-shimmer>
    `}shimmerTemplate(){return this.type==="network"?E` <wui-shimmer
          data-type=${this.type}
          width="48px"
          height="54px"
          borderRadius="xs"
        ></wui-shimmer>
        ${Ao}`:E`<wui-shimmer width="56px" height="56px" borderRadius="xs"></wui-shimmer>`}};pt.styles=[K,Q,jo];vn([c()],pt.prototype,"type",void 0);pt=vn([W("wui-card-select-loader")],pt);const zo=q`
  :host {
    display: grid;
    width: inherit;
    height: inherit;
  }
`;var ie=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let J=class extends V{render(){return this.style.cssText=`
      grid-template-rows: ${this.gridTemplateRows};
      grid-template-columns: ${this.gridTemplateColumns};
      justify-items: ${this.justifyItems};
      align-items: ${this.alignItems};
      justify-content: ${this.justifyContent};
      align-content: ${this.alignContent};
      column-gap: ${this.columnGap&&`var(--wui-spacing-${this.columnGap})`};
      row-gap: ${this.rowGap&&`var(--wui-spacing-${this.rowGap})`};
      gap: ${this.gap&&`var(--wui-spacing-${this.gap})`};
      padding-top: ${this.padding&&pe.getSpacingStyles(this.padding,0)};
      padding-right: ${this.padding&&pe.getSpacingStyles(this.padding,1)};
      padding-bottom: ${this.padding&&pe.getSpacingStyles(this.padding,2)};
      padding-left: ${this.padding&&pe.getSpacingStyles(this.padding,3)};
      margin-top: ${this.margin&&pe.getSpacingStyles(this.margin,0)};
      margin-right: ${this.margin&&pe.getSpacingStyles(this.margin,1)};
      margin-bottom: ${this.margin&&pe.getSpacingStyles(this.margin,2)};
      margin-left: ${this.margin&&pe.getSpacingStyles(this.margin,3)};
    `,E`<slot></slot>`}};J.styles=[K,zo];ie([c()],J.prototype,"gridTemplateRows",void 0);ie([c()],J.prototype,"gridTemplateColumns",void 0);ie([c()],J.prototype,"justifyItems",void 0);ie([c()],J.prototype,"alignItems",void 0);ie([c()],J.prototype,"justifyContent",void 0);ie([c()],J.prototype,"alignContent",void 0);ie([c()],J.prototype,"columnGap",void 0);ie([c()],J.prototype,"rowGap",void 0);ie([c()],J.prototype,"gap",void 0);ie([c()],J.prototype,"padding",void 0);ie([c()],J.prototype,"margin",void 0);J=ie([W("wui-grid")],J);const ko=_e`
  button {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    width: 104px;
    row-gap: var(--wui-spacing-xs);
    padding: var(--wui-spacing-s) var(--wui-spacing-0);
    background-color: var(--wui-color-gray-glass-002);
    border-radius: clamp(0px, var(--wui-border-radius-xs), 20px);
    transition:
      color var(--wui-duration-lg) var(--wui-ease-out-power-1),
      background-color var(--wui-duration-lg) var(--wui-ease-out-power-1),
      border-radius var(--wui-duration-lg) var(--wui-ease-out-power-1);
    will-change: background-color, color, border-radius;
    outline: none;
    border: none;
  }

  button > wui-flex > wui-text {
    color: var(--wui-color-fg-100);
    max-width: 86px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    justify-content: center;
  }

  button > wui-flex > wui-text.certified {
    max-width: 66px;
  }

  button:hover:enabled {
    background-color: var(--wui-color-gray-glass-005);
  }

  button:disabled > wui-flex > wui-text {
    color: var(--wui-color-gray-glass-015);
  }

  [data-selected='true'] {
    background-color: var(--wui-color-accent-glass-020);
  }

  @media (hover: hover) and (pointer: fine) {
    [data-selected='true']:hover:enabled {
      background-color: var(--wui-color-accent-glass-015);
    }
  }

  [data-selected='true']:active:enabled {
    background-color: var(--wui-color-accent-glass-010);
  }

  @media (max-width: 350px) {
    button {
      width: 100%;
    }
  }
`;var Qe=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let Ie=class extends U{constructor(){super(),this.observer=new IntersectionObserver(()=>{}),this.visible=!1,this.imageSrc=void 0,this.imageLoading=!1,this.wallet=void 0,this.observer=new IntersectionObserver(e=>{e.forEach(i=>{i.isIntersecting?(this.visible=!0,this.fetchImageSrc()):this.visible=!1})},{threshold:.01})}firstUpdated(){this.observer.observe(this)}disconnectedCallback(){this.observer.disconnect()}render(){var i,n;const e=((i=this.wallet)==null?void 0:i.badge_type)==="certified";return u`
      <button>
        ${this.imageTemplate()}
        <wui-flex flexDirection="row" alignItems="center" justifyContent="center" gap="3xs">
          <wui-text
            variant="tiny-500"
            color="inherit"
            class=${j(e?"certified":void 0)}
            >${(n=this.wallet)==null?void 0:n.name}</wui-text
          >
          ${e?u`<wui-icon size="sm" name="walletConnectBrown"></wui-icon>`:null}
        </wui-flex>
      </button>
    `}imageTemplate(){var e,i;return!this.visible&&!this.imageSrc||this.imageLoading?this.shimmerTemplate():u`
      <wui-wallet-image
        size="md"
        imageSrc=${j(this.imageSrc)}
        name=${(e=this.wallet)==null?void 0:e.name}
        .installed=${(i=this.wallet)==null?void 0:i.installed}
        badgeSize="sm"
      >
      </wui-wallet-image>
    `}shimmerTemplate(){return u`<wui-shimmer width="56px" height="56px" borderRadius="xs"></wui-shimmer>`}async fetchImageSrc(){this.wallet&&(this.imageSrc=Y.getWalletImage(this.wallet),!this.imageSrc&&(this.imageLoading=!0,this.imageSrc=await Y.fetchWalletImage(this.wallet.image_id),this.imageLoading=!1))}};Ie.styles=ko;Qe([O()],Ie.prototype,"visible",void 0);Qe([O()],Ie.prototype,"imageSrc",void 0);Qe([O()],Ie.prototype,"imageLoading",void 0);Qe([M()],Ie.prototype,"wallet",void 0);Ie=Qe([W("w3m-all-wallets-list-item")],Ie);const Do=_e`
  wui-grid {
    max-height: clamp(360px, 400px, 80vh);
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-loading-spinner {
    padding-top: var(--wui-spacing-l);
    padding-bottom: var(--wui-spacing-l);
    justify-content: center;
    grid-column: 1 / span 4;
  }
`;var Xe=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};const nn="local-paginator";let Ee=class extends U{constructor(){super(),this.unsubscribe=[],this.paginationObserver=void 0,this.loading=!N.state.wallets.length,this.wallets=N.state.wallets,this.recommended=N.state.recommended,this.featured=N.state.featured,this.unsubscribe.push(N.subscribeKey("wallets",e=>this.wallets=e),N.subscribeKey("recommended",e=>this.recommended=e),N.subscribeKey("featured",e=>this.featured=e))}firstUpdated(){this.initialFetch(),this.createPaginationObserver()}disconnectedCallback(){var e;this.unsubscribe.forEach(i=>i()),(e=this.paginationObserver)==null||e.disconnect()}render(){return u`
      <wui-grid
        data-scroll=${!this.loading}
        .padding=${["0","s","s","s"]}
        columnGap="xxs"
        rowGap="l"
        justifyContent="space-between"
      >
        ${this.loading?this.shimmerTemplate(16):this.walletsTemplate()}
        ${this.paginationLoaderTemplate()}
      </wui-grid>
    `}async initialFetch(){var i;this.loading=!0;const e=(i=this.shadowRoot)==null?void 0:i.querySelector("wui-grid");e&&(await N.fetchWallets({page:1}),await e.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.loading=!1,e.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}shimmerTemplate(e,i){return[...Array(e)].map(()=>u`
        <wui-card-select-loader type="wallet" id=${j(i)}></wui-card-select-loader>
      `)}walletsTemplate(){const e=L.uniqueBy([...this.featured,...this.recommended,...this.wallets],"id");return li.markWalletsAsInstalled(e).map(n=>u`
        <w3m-all-wallets-list-item
          @click=${()=>this.onConnectWallet(n)}
          .wallet=${n}
        ></w3m-all-wallets-list-item>
      `)}paginationLoaderTemplate(){const{wallets:e,recommended:i,featured:n,count:o}=N.state,t=window.innerWidth<352?3:4,a=e.length+i.length;let l=Math.ceil(a/t)*t-a+t;return l-=e.length?n.length%t:0,o===0&&n.length>0?null:o===0||[...n,...e,...i].length<o?this.shimmerTemplate(l,nn):null}createPaginationObserver(){var i;const e=(i=this.shadowRoot)==null?void 0:i.querySelector(`#${nn}`);e&&(this.paginationObserver=new IntersectionObserver(([n])=>{if(n!=null&&n.isIntersecting&&!this.loading){const{page:o,count:t,wallets:a}=N.state;a.length<t&&N.fetchWallets({page:o+1})}}),this.paginationObserver.observe(e))}onConnectWallet(e){D.selectWalletConnector(e)}};Ee.styles=Do;Xe([O()],Ee.prototype,"loading",void 0);Xe([O()],Ee.prototype,"wallets",void 0);Xe([O()],Ee.prototype,"recommended",void 0);Xe([O()],Ee.prototype,"featured",void 0);Ee=Xe([W("w3m-all-wallets-list")],Ee);const No=_e`
  wui-grid,
  wui-loading-spinner,
  wui-flex {
    height: 360px;
  }

  wui-grid {
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-loading-spinner {
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;var It=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let ze=class extends U{constructor(){super(...arguments),this.prevQuery="",this.prevBadge=void 0,this.loading=!0,this.query=""}render(){return this.onSearch(),this.loading?u`<wui-loading-spinner color="accent-100"></wui-loading-spinner>`:this.walletsTemplate()}async onSearch(){(this.query.trim()!==this.prevQuery.trim()||this.badge!==this.prevBadge)&&(this.prevQuery=this.query,this.prevBadge=this.badge,this.loading=!0,await N.searchWallet({search:this.query,badge:this.badge}),this.loading=!1)}walletsTemplate(){const{search:e}=N.state,i=li.markWalletsAsInstalled(e);return e.length?u`
      <wui-grid
        data-testid="wallet-list"
        .padding=${["0","s","s","s"]}
        rowGap="l"
        columnGap="xs"
        justifyContent="space-between"
      >
        ${i.map(n=>u`
            <w3m-all-wallets-list-item
              @click=${()=>this.onConnectWallet(n)}
              .wallet=${n}
              data-testid="wallet-search-item-${n.id}"
            ></w3m-all-wallets-list-item>
          `)}
      </wui-grid>
    `:u`
        <wui-flex
          data-testid="no-wallet-found"
          justifyContent="center"
          alignItems="center"
          gap="s"
          flexDirection="column"
        >
          <wui-icon-box
            size="lg"
            iconColor="fg-200"
            backgroundColor="fg-300"
            icon="wallet"
            background="transparent"
          ></wui-icon-box>
          <wui-text data-testid="no-wallet-found-text" color="fg-200" variant="paragraph-500">
            No Wallet found
          </wui-text>
        </wui-flex>
      `}onConnectWallet(e){D.selectWalletConnector(e)}};ze.styles=No;It([O()],ze.prototype,"loading",void 0);It([M()],ze.prototype,"query",void 0);It([M()],ze.prototype,"badge",void 0);ze=It([W("w3m-all-wallets-search")],ze);var bi=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let gt=class extends U{constructor(){super(...arguments),this.search="",this.onDebouncedSearch=L.debounce(e=>{this.search=e})}render(){const e=this.search.length>=2;return u`
      <wui-flex .padding=${["0","s","s","s"]} gap="xs">
        <wui-search-bar @inputChange=${this.onInputChange.bind(this)}></wui-search-bar>
        <wui-certified-switch
          ?checked=${this.badge}
          @click=${this.onClick.bind(this)}
          data-testid="wui-certified-switch"
        ></wui-certified-switch>
        ${this.qrButtonTemplate()}
      </wui-flex>
      ${e||this.badge?u`<w3m-all-wallets-search
            query=${this.search}
            badge=${j(this.badge)}
          ></w3m-all-wallets-search>`:u`<w3m-all-wallets-list badge=${j(this.badge)}></w3m-all-wallets-list>`}
    `}onInputChange(e){this.onDebouncedSearch(e.detail)}onClick(){if(this.badge==="certified"){this.badge=void 0;return}this.badge="certified",it.showSvg("Only WalletConnect certified",{icon:"walletConnectBrown",iconColor:"accent-100"})}qrButtonTemplate(){return L.isMobile()?u`
        <wui-icon-box
          size="lg"
          iconSize="xl"
          iconColor="accent-100"
          backgroundColor="accent-100"
          icon="qrCode"
          background="transparent"
          border
          borderColor="wui-accent-glass-010"
          @click=${this.onWalletConnectQr.bind(this)}
        ></wui-icon-box>
      `:null}onWalletConnectQr(){F.push("ConnectingWalletConnect")}};bi([O()],gt.prototype,"search",void 0);bi([O()],gt.prototype,"badge",void 0);gt=bi([W("w3m-all-wallets-view")],gt);const Mo=q`
  button {
    column-gap: var(--wui-spacing-s);
    padding: 11px 18px 11px var(--wui-spacing-s);
    width: 100%;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
    color: var(--wui-color-fg-250);
    transition:
      color var(--wui-ease-out-power-1) var(--wui-duration-md),
      background-color var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: color, background-color;
  }

  button[data-iconvariant='square'],
  button[data-iconvariant='square-blue'] {
    padding: 6px 18px 6px 9px;
  }

  button > wui-flex {
    flex: 1;
  }

  button > wui-image {
    width: 32px;
    height: 32px;
    box-shadow: 0 0 0 2px var(--wui-color-gray-glass-005);
    border-radius: var(--wui-border-radius-3xl);
  }

  button > wui-icon {
    width: 36px;
    height: 36px;
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
  }

  button > wui-icon-box[data-variant='blue'] {
    box-shadow: 0 0 0 2px var(--wui-color-accent-glass-005);
  }

  button > wui-icon-box[data-variant='overlay'] {
    box-shadow: 0 0 0 2px var(--wui-color-gray-glass-005);
  }

  button > wui-icon-box[data-variant='square-blue'] {
    border-radius: var(--wui-border-radius-3xs);
    position: relative;
    border: none;
    width: 36px;
    height: 36px;
  }

  button > wui-icon-box[data-variant='square-blue']::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: inherit;
    border: 1px solid var(--wui-color-accent-glass-010);
    pointer-events: none;
  }

  button > wui-icon:last-child {
    width: 14px;
    height: 14px;
  }

  button:disabled {
    color: var(--wui-color-gray-glass-020);
  }

  button[data-loading='true'] > wui-icon {
    opacity: 0;
  }

  wui-loading-spinner {
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
  }
`;var ae=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let Z=class extends V{constructor(){super(...arguments),this.tabIdx=void 0,this.variant="icon",this.disabled=!1,this.imageSrc=void 0,this.alt=void 0,this.chevron=!1,this.loading=!1}render(){return E`
      <button
        ?disabled=${this.loading?!0:!!this.disabled}
        data-loading=${this.loading}
        data-iconvariant=${ge(this.iconVariant)}
        tabindex=${ge(this.tabIdx)}
      >
        ${this.loadingTemplate()} ${this.visualTemplate()}
        <wui-flex gap="3xs">
          <slot></slot>
        </wui-flex>
        ${this.chevronTemplate()}
      </button>
    `}visualTemplate(){if(this.variant==="image"&&this.imageSrc)return E`<wui-image src=${this.imageSrc} alt=${this.alt??"list item"}></wui-image>`;if(this.iconVariant==="square"&&this.icon&&this.variant==="icon")return E`<wui-icon name=${this.icon}></wui-icon>`;if(this.variant==="icon"&&this.icon&&this.iconVariant){const e=["blue","square-blue"].includes(this.iconVariant)?"accent-100":"fg-200",i=this.iconVariant==="square-blue"?"mdl":"md",n=this.iconSize?this.iconSize:i;return E`
        <wui-icon-box
          data-variant=${this.iconVariant}
          icon=${this.icon}
          iconSize=${n}
          background="transparent"
          iconColor=${e}
          backgroundColor=${e}
          size=${i}
        ></wui-icon-box>
      `}return null}loadingTemplate(){return this.loading?E`<wui-loading-spinner
        data-testid="wui-list-item-loading-spinner"
        color="fg-300"
      ></wui-loading-spinner>`:E``}chevronTemplate(){return this.chevron?E`<wui-icon size="inherit" color="fg-200" name="chevronRight"></wui-icon>`:null}};Z.styles=[K,Q,Mo];ae([c()],Z.prototype,"icon",void 0);ae([c()],Z.prototype,"iconSize",void 0);ae([c()],Z.prototype,"tabIdx",void 0);ae([c()],Z.prototype,"variant",void 0);ae([c()],Z.prototype,"iconVariant",void 0);ae([c({type:Boolean})],Z.prototype,"disabled",void 0);ae([c()],Z.prototype,"imageSrc",void 0);ae([c()],Z.prototype,"alt",void 0);ae([c({type:Boolean})],Z.prototype,"chevron",void 0);ae([c({type:Boolean})],Z.prototype,"loading",void 0);Z=ae([W("wui-list-item")],Z);var Uo=function(r,e,i,n){var o=arguments.length,t=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,n);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,i,t):a(e,i))||t);return o>3&&t&&Object.defineProperty(e,i,t),t};let on=class extends U{constructor(){var e;super(...arguments),this.wallet=(e=F.state.data)==null?void 0:e.wallet}render(){if(!this.wallet)throw new Error("w3m-downloads-view");return u`
      <wui-flex gap="xs" flexDirection="column" .padding=${["s","s","l","s"]}>
        ${this.chromeTemplate()} ${this.iosTemplate()} ${this.androidTemplate()}
        ${this.homepageTemplate()}
      </wui-flex>
    `}chromeTemplate(){var e;return(e=this.wallet)!=null&&e.chrome_store?u`<wui-list-item
      variant="icon"
      icon="chromeStore"
      iconVariant="square"
      @click=${this.onChromeStore.bind(this)}
      chevron
    >
      <wui-text variant="paragraph-500" color="fg-100">Chrome Extension</wui-text>
    </wui-list-item>`:null}iosTemplate(){var e;return(e=this.wallet)!=null&&e.app_store?u`<wui-list-item
      variant="icon"
      icon="appStore"
      iconVariant="square"
      @click=${this.onAppStore.bind(this)}
      chevron
    >
      <wui-text variant="paragraph-500" color="fg-100">iOS App</wui-text>
    </wui-list-item>`:null}androidTemplate(){var e;return(e=this.wallet)!=null&&e.play_store?u`<wui-list-item
      variant="icon"
      icon="playStore"
      iconVariant="square"
      @click=${this.onPlayStore.bind(this)}
      chevron
    >
      <wui-text variant="paragraph-500" color="fg-100">Android App</wui-text>
    </wui-list-item>`:null}homepageTemplate(){var e;return(e=this.wallet)!=null&&e.homepage?u`
      <wui-list-item
        variant="icon"
        icon="browser"
        iconVariant="square-blue"
        @click=${this.onHomePage.bind(this)}
        chevron
      >
        <wui-text variant="paragraph-500" color="fg-100">Website</wui-text>
      </wui-list-item>
    `:null}onChromeStore(){var e;(e=this.wallet)!=null&&e.chrome_store&&L.openHref(this.wallet.chrome_store,"_blank")}onAppStore(){var e;(e=this.wallet)!=null&&e.app_store&&L.openHref(this.wallet.app_store,"_blank")}onPlayStore(){var e;(e=this.wallet)!=null&&e.play_store&&L.openHref(this.wallet.play_store,"_blank")}onHomePage(){var e;(e=this.wallet)!=null&&e.homepage&&L.openHref(this.wallet.homepage,"_blank")}};on=Uo([W("w3m-downloads-view")],on);export{gt as W3mAllWalletsView,ai as W3mConnectingWcBasicView,on as W3mDownloadsView};
//# sourceMappingURL=basic-B3oJ-4iL.js.map
