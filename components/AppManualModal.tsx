import React from 'react'
import { X, FileText, Save, Trash2, Info, Menu, Copy } from 'lucide-react'

interface AppManualModalProps {
    isOpen: boolean
    onClose: () => void
}

export const AppManualModal: React.FC<AppManualModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-lg font-bold">Minds of History - 利用ガイド</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar text-gray-800 dark:text-gray-200 space-y-8">

                    {/* Intro */}
                    <section>
                        <h4 className="text-xl font-bold mb-3 text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                            <span className="text-2xl">🏛️</span> はじめに
                        </h4>
                        <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                            このアプリは、歴史上の偉人たちの人格を再現したAIと対話し、現代の悩みを解決するための<span className="font-bold text-indigo-600 dark:text-indigo-400">「対話型思考ツール」</span>です。
                        </p>
                    </section>

                    {/* Basic Usage */}
                    <section>
                        <h4 className="text-lg font-bold border-b pb-2 mb-4 border-gray-200 dark:border-zinc-700">基本的な使い方</h4>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl text-center">
                                <div className="mx-auto w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-2 text-indigo-600 dark:text-indigo-400">
                                    <Menu className="h-5 w-5" />
                                </div>
                                <h5 className="font-bold mb-1">1. 選ぶ</h5>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    左上のメニューから<br />相談したい偉人を選択
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl text-center">
                                <div className="mx-auto w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-2 text-indigo-600 dark:text-indigo-400">
                                    <span className="text-lg">💬</span>
                                </div>
                                <h5 className="font-bold mb-1">2. 対話する</h5>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    悩みを打ち明け<br />深く語り合う
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl text-center">
                                <div className="mx-auto w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-2 text-indigo-600 dark:text-indigo-400">
                                    <Save className="h-5 w-5" />
                                </div>
                                <h5 className="font-bold mb-1">3. 記録する</h5>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    「記録して終了」で<br />要約を保存・リセット
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Useful Features */}
                    <section className="space-y-6">
                        <h4 className="text-lg font-bold border-b pb-2 border-gray-200 dark:border-zinc-700">便利な機能</h4>

                        <div className="flex gap-4 items-start">
                            <div className="shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <h5 className="font-bold text-gray-900 dark:text-white mb-2">カルテ（要約）の活用</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                                    他の偉人に相談を引き継ぐ際、これまでの経緯をイチから説明するのは大変です。そんな時は「カルテ」機能を使いましょう。
                                </p>
                                <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2 bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                                    <li className="pl-1">画面右上の「カルテ作成（<FileText className="inline h-3 w-3 align-middle" />）」ボタンを押す</li>
                                    <li className="pl-1">表示された対話の要約テキストを「コピー」する</li>
                                    <li className="pl-1">他の偉人とのチャットで、テキストを貼り付けて送信</li>
                                </ol>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                                <Trash2 className="h-5 w-5" />
                            </div>
                            <div>
                                <h5 className="font-bold text-gray-900 dark:text-white mb-2">履歴の完全削除</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                    全てのチャット履歴を消去したい場合は、画面右上の「ゴミ箱アイコン（<Trash2 className="inline h-3 w-3 align-middle" />）」を押してください。<br />
                                    <span className="text-red-500 text-xs block mt-1">※削除されたデータは復元できません。ご注意ください。</span>
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Pro Tips */}
                    <section className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-5 shadow-sm">
                        <h4 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                            <span>💡</span> 有意義な探索を行うためのコツ
                        </h4>
                        <div className="space-y-4 text-amber-900 dark:text-amber-100/90 text-sm leading-relaxed">
                            <p>一人の偉人との対話だけで終わらせず、複数の視点を取り入れてみましょう。</p>

                            <div className="space-y-3 pl-2 sm:pl-4">
                                <div className="flex gap-3">
                                    <div className="shrink-0 w-16 font-bold text-amber-600 dark:text-amber-400">Step 1</div>
                                    <div>まずは<span className="font-bold">「コンシェルジュ」</span>と話し、自分の悩みを整理してもらう。</div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="shrink-0 w-16 font-bold text-amber-600 dark:text-amber-400">Step 2</div>
                                    <div>コンシェルジュが推薦した偉人とじっくり語り合う。</div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="shrink-0 w-16 font-bold text-amber-600 dark:text-amber-400">Step 3</div>
                                    <div className="flex-1">
                                        <div className="mb-2">
                                            対話が終わったら<span className="font-bold border-b border-amber-400 border-dotted mx-1">「カルテ作成」</span>ボタンで内容を出力してください。
                                        </div>
                                        <div className="bg-white/60 dark:bg-black/20 p-3 rounded-lg text-amber-800 dark:text-amber-200 italic mb-2 relative">
                                            <Copy className="absolute top-2 right-2 h-3 w-3 opacity-50" />
                                            「その内容をコピーして<span className="font-bold">コンシェルジュ</span>に伝え、『次にどの偉人と相談したら良いか？』と尋ねてみましょう」
                                        </div>
                                        <div>
                                            あなたの今の状態に最も適した、次なる賢者を推薦してくれるはずです。
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <div className="p-4 border-t dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-colors shadow-sm"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    )
}
